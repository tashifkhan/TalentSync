"""Question generator service for interviews."""

import json
import random
from typing import Any, Dict, List, Optional

from app.core.llm import get_llm
from app.data.prompt.interview_question import get_question_generation_prompt
from app.models.interview.enums import DifficultyLevel, QuestionSource
from app.models.interview.schemas import InterviewQuestion
from app.models.interview.templates import QuestionTemplate, get_template


class QuestionGenerator:
    """Generates interview questions using LLM and templates."""

    def __init__(self):
        self.llm = get_llm()
        self.prompt = get_question_generation_prompt()

    async def generate_questions(
        self,
        role: str,
        num_questions: int,
        difficulty_distribution: Dict[str, int],
        template_id: Optional[str] = None,
        topic: Optional[str] = None,
        resume_data: Optional[Dict[str, Any]] = None,
    ) -> List[InterviewQuestion]:
        """Generate a list of interview questions based on configuration.

        Args:
            role: The job role for the interview
            num_questions: Total number of questions to generate
            difficulty_distribution: Dict mapping difficulty to count
            template_id: Optional template ID to use predefined questions
            topic: Optional topic focus
            resume_data: Optional candidate resume data for personalization

        Returns:
            List of InterviewQuestion objects
        """
        questions: List[InterviewQuestion] = []
        existing_question_texts: List[str] = []

        # Get template if specified
        template = get_template(template_id) if template_id else None

        # Build question list based on difficulty distribution
        question_specs: List[Dict[str, Any]] = []
        total_requested = 0
        for difficulty_str, count in difficulty_distribution.items():
            try:
                difficulty = DifficultyLevel(difficulty_str)
            except ValueError:
                difficulty = DifficultyLevel.MEDIUM
            for _ in range(count):
                question_specs.append({"difficulty": difficulty})
                total_requested += 1

        # Pad or trim to match num_questions
        if total_requested < num_questions:
            remaining = num_questions - total_requested
            fallback_difficulties = [
                DifficultyLevel.MEDIUM,
                DifficultyLevel.EASY,
                DifficultyLevel.HARD,
            ]
            for i in range(remaining):
                question_specs.append(
                    {
                        "difficulty": fallback_difficulties[
                            i % len(fallback_difficulties)
                        ]
                    }
                )

        # Limit to num_questions
        question_specs = question_specs[:num_questions]

        # Generate each question
        for idx, spec in enumerate(question_specs):
            difficulty = spec["difficulty"]

            # Try to use template question first
            template_question = self._get_template_question(
                template, difficulty, existing_question_texts
            )

            if template_question:
                question = InterviewQuestion(
                    index=idx,
                    question=template_question.question,
                    difficulty=difficulty,
                    source=template_question.source,
                    topic=template_question.topic,
                    expected_keywords=template_question.expected_keywords,
                    follow_up_questions=template_question.follow_up_questions,
                    code_challenge=template_question.code_challenge,
                )
            else:
                # Generate with LLM
                question = await self._generate_llm_question(
                    idx=idx,
                    role=role,
                    difficulty=difficulty,
                    topic=topic
                    or (
                        template.topics[0]
                        if template and template.topics
                        else "General"
                    ),
                    resume_data=resume_data,
                    existing_questions=existing_question_texts,
                )

            questions.append(question)
            existing_question_texts.append(question.question)

        return questions

    def _get_template_question(
        self,
        template: Optional[Any],
        difficulty: DifficultyLevel,
        existing_questions: List[str],
    ) -> Optional[QuestionTemplate]:
        """Get a question from the template bank matching criteria."""
        if not template or not template.question_bank:
            return None

        # Filter questions by difficulty and not already used
        matching = [
            q
            for q in template.question_bank
            if q.difficulty == difficulty and q.question not in existing_questions
        ]

        if not matching:
            return None

        return random.choice(matching)

    async def _generate_llm_question(
        self,
        idx: int,
        role: str,
        difficulty: DifficultyLevel,
        topic: str,
        resume_data: Optional[Dict[str, Any]],
        existing_questions: List[str],
    ) -> InterviewQuestion:
        """Generate a question using the LLM."""
        # Determine question type based on index and difficulty
        question_types = ["technical", "behavioral", "role_based"]
        question_type = question_types[idx % len(question_types)]

        # Format candidate background
        candidate_background = "No resume provided"
        if resume_data:
            candidate_background = json.dumps(resume_data, indent=2)[:2000]

        # Format existing questions
        existing_str = (
            "\n".join(f"- {q}" for q in existing_questions)
            if existing_questions
            else "None"
        )

        # Create chain and invoke
        if self.llm:
            chain = self.prompt | self.llm

            try:
                response = await chain.ainvoke(
                    {
                        "role": role,
                        "difficulty": difficulty.value,
                        "topic": topic,
                        "question_type": question_type,
                        "candidate_background": candidate_background,
                        "existing_questions": existing_str,
                        "additional_context": "",
                    }
                )

                # Parse response
                if hasattr(response, "content"):
                    content = response.content
                else:
                    content = response
                if not isinstance(content, str):
                    content = json.dumps(content, ensure_ascii=True)
                parsed = self._parse_question_response(content)

                return InterviewQuestion(
                    index=idx,
                    question=parsed.get(
                        "question", f"Tell me about your experience with {topic}"
                    ),
                    difficulty=difficulty,
                    source=QuestionSource(question_type)
                    if question_type in [e.value for e in QuestionSource]
                    else QuestionSource.ROLE_BASED,
                    topic=topic,
                    expected_keywords=parsed.get("expected_keywords", []),
                    follow_up_questions=parsed.get("follow_up_questions", []),
                )
            except Exception as e:
                # Fallback question on error
                return self._get_fallback_question(idx, role, difficulty, topic)

        return self._get_fallback_question(idx, role, difficulty, topic)

    def _parse_question_response(self, content: str) -> Dict[str, Any]:
        """Parse the LLM response to extract question data."""
        try:
            # Try to find JSON in the response
            start = content.find("{")
            end = content.rfind("}") + 1
            if start != -1 and end > start:
                json_str = content[start:end]
                return json.loads(json_str)
        except json.JSONDecodeError:
            pass

        # Return the content as the question if parsing fails
        return {"question": content.strip()}

    def _get_fallback_question(
        self,
        idx: int,
        role: str,
        difficulty: DifficultyLevel,
        topic: str,
    ) -> InterviewQuestion:
        """Get a fallback question if LLM generation fails."""
        fallback_questions = [
            f"Can you describe your experience with {topic} in your previous roles?",
            f"What challenges have you faced when working on {topic} and how did you overcome them?",
            f"How would you approach solving a complex problem related to {topic}?",
            f"Tell me about a project where you demonstrated skills relevant to {role}.",
            f"What is your approach to learning new technologies or concepts in {topic}?",
        ]

        return InterviewQuestion(
            index=idx,
            question=fallback_questions[idx % len(fallback_questions)],
            difficulty=difficulty,
            source=QuestionSource.BEHAVIORAL,
            topic=topic,
            expected_keywords=[],
            follow_up_questions=[],
        )

    async def generate_single_question(
        self,
        role: str,
        difficulty: DifficultyLevel,
        topic: str,
        existing_questions: List[str],
        resume_data: Optional[Dict[str, Any]] = None,
    ) -> InterviewQuestion:
        """Generate a single interview question."""
        return await self._generate_llm_question(
            idx=len(existing_questions),
            role=role,
            difficulty=difficulty,
            topic=topic,
            resume_data=resume_data,
            existing_questions=existing_questions,
        )
