"""Built-in interview templates for common roles."""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.models.interview.enums import DifficultyLevel, QuestionSource


class QuestionTemplate(BaseModel):
    """Pre-defined question with metadata."""

    question: str
    difficulty: DifficultyLevel
    source: QuestionSource
    topic: str
    expected_keywords: List[str] = Field(default_factory=list)
    follow_up_questions: List[str] = Field(default_factory=list)
    code_challenge: Optional[str] = None


class InterviewTemplate(BaseModel):
    """Complete interview template for a role."""

    id: str
    name: str
    role: str
    description: str
    icon: str  # lucide icon name
    default_num_questions: int = 5
    difficulty_distribution: Dict[str, int] = Field(
        default_factory=lambda: {"easy": 1, "medium": 3, "hard": 1}
    )
    question_bank: List[QuestionTemplate] = Field(default_factory=list)
    topics: List[str] = Field(default_factory=list)
    includes_coding: bool = False
    coding_languages: List[str] = Field(default_factory=list)
    estimated_duration_minutes: int = 30


# Built-in templates
TEMPLATES: Dict[str, InterviewTemplate] = {
    "software_engineer": InterviewTemplate(
        id="software_engineer",
        name="Software Engineer",
        role="Software Engineer",
        description="Full-stack or backend engineering role with technical and coding questions",
        icon="Code2",
        includes_coding=True,
        coding_languages=["python", "javascript", "typescript"],
        topics=[
            "Data Structures",
            "Algorithms",
            "System Design",
            "Problem Solving",
            "Behavioral",
        ],
        estimated_duration_minutes=45,
        question_bank=[
            QuestionTemplate(
                question="Explain the difference between a stack and a queue. When would you use each?",
                difficulty=DifficultyLevel.EASY,
                source=QuestionSource.TECHNICAL,
                topic="Data Structures",
                expected_keywords=[
                    "LIFO",
                    "FIFO",
                    "push",
                    "pop",
                    "enqueue",
                    "dequeue",
                    "recursion",
                    "BFS",
                ],
            ),
            QuestionTemplate(
                question="What is the time complexity of searching in a hash table vs a binary search tree?",
                difficulty=DifficultyLevel.EASY,
                source=QuestionSource.TECHNICAL,
                topic="Data Structures",
                expected_keywords=[
                    "O(1)",
                    "O(log n)",
                    "average case",
                    "worst case",
                    "collision",
                ],
            ),
            QuestionTemplate(
                question="Describe a challenging technical problem you solved. What was your approach?",
                difficulty=DifficultyLevel.MEDIUM,
                source=QuestionSource.BEHAVIORAL,
                topic="Problem Solving",
                expected_keywords=[
                    "debugging",
                    "analysis",
                    "solution",
                    "iteration",
                    "learning",
                ],
            ),
            QuestionTemplate(
                question="How would you design a rate limiter for an API? What data structures would you use?",
                difficulty=DifficultyLevel.MEDIUM,
                source=QuestionSource.TECHNICAL,
                topic="System Design",
                expected_keywords=[
                    "sliding window",
                    "token bucket",
                    "Redis",
                    "distributed",
                    "concurrency",
                ],
            ),
            QuestionTemplate(
                question="Explain the CAP theorem and its implications for distributed systems.",
                difficulty=DifficultyLevel.HARD,
                source=QuestionSource.TECHNICAL,
                topic="System Design",
                expected_keywords=[
                    "consistency",
                    "availability",
                    "partition tolerance",
                    "trade-offs",
                    "eventual consistency",
                ],
            ),
            QuestionTemplate(
                question="Design a URL shortener service. How would you handle billions of URLs?",
                difficulty=DifficultyLevel.HARD,
                source=QuestionSource.TECHNICAL,
                topic="System Design",
                expected_keywords=[
                    "hashing",
                    "base62",
                    "database sharding",
                    "caching",
                    "analytics",
                    "expiration",
                ],
            ),
            QuestionTemplate(
                question="Write a function to find the first non-repeating character in a string.",
                difficulty=DifficultyLevel.MEDIUM,
                source=QuestionSource.CODING,
                topic="Algorithms",
                code_challenge="def first_non_repeating(s: str) -> str:\n    # Return the first character that appears only once\n    # Return empty string if no such character exists\n    pass\n\n# Example:\n# first_non_repeating('aabbccd') -> 'd'\n# first_non_repeating('aabbcc') -> ''",
                expected_keywords=["hash map", "counter", "O(n)", "dictionary"],
            ),
        ],
    ),
    "frontend_developer": InterviewTemplate(
        id="frontend_developer",
        name="Frontend Developer",
        role="Frontend Developer",
        description="React/Vue/Angular development with focus on UI/UX and web technologies",
        icon="Layout",
        includes_coding=True,
        coding_languages=["javascript", "typescript"],
        topics=[
            "React",
            "CSS",
            "Performance",
            "Accessibility",
            "State Management",
            "Behavioral",
        ],
        estimated_duration_minutes=40,
        question_bank=[
            QuestionTemplate(
                question="Explain the virtual DOM and how it improves performance in React.",
                difficulty=DifficultyLevel.EASY,
                source=QuestionSource.TECHNICAL,
                topic="React",
                expected_keywords=[
                    "diffing",
                    "reconciliation",
                    "batch updates",
                    "real DOM",
                    "performance",
                ],
            ),
            QuestionTemplate(
                question="What is the difference between CSS Grid and Flexbox? When would you use each?",
                difficulty=DifficultyLevel.EASY,
                source=QuestionSource.TECHNICAL,
                topic="CSS",
                expected_keywords=[
                    "one-dimensional",
                    "two-dimensional",
                    "layout",
                    "responsive",
                    "alignment",
                ],
            ),
            QuestionTemplate(
                question="How would you optimize a React application that's rendering slowly?",
                difficulty=DifficultyLevel.MEDIUM,
                source=QuestionSource.TECHNICAL,
                topic="Performance",
                expected_keywords=[
                    "memo",
                    "useMemo",
                    "useCallback",
                    "virtualization",
                    "lazy loading",
                    "profiler",
                ],
            ),
            QuestionTemplate(
                question="Explain how you would implement accessibility in a web application.",
                difficulty=DifficultyLevel.MEDIUM,
                source=QuestionSource.TECHNICAL,
                topic="Accessibility",
                expected_keywords=[
                    "ARIA",
                    "semantic HTML",
                    "keyboard navigation",
                    "screen reader",
                    "contrast",
                ],
            ),
            QuestionTemplate(
                question="Compare different state management solutions. When would you use Redux vs Context API?",
                difficulty=DifficultyLevel.HARD,
                source=QuestionSource.TECHNICAL,
                topic="State Management",
                expected_keywords=[
                    "global state",
                    "prop drilling",
                    "middleware",
                    "performance",
                    "complexity",
                ],
            ),
        ],
    ),
    "product_manager": InterviewTemplate(
        id="product_manager",
        name="Product Manager",
        role="Product Manager",
        description="Product strategy, user research, and stakeholder management",
        icon="Lightbulb",
        includes_coding=False,
        topics=[
            "Product Strategy",
            "User Research",
            "Metrics",
            "Prioritization",
            "Stakeholder Management",
        ],
        estimated_duration_minutes=35,
        question_bank=[
            QuestionTemplate(
                question="How do you prioritize features when you have limited resources?",
                difficulty=DifficultyLevel.EASY,
                source=QuestionSource.ROLE_BASED,
                topic="Prioritization",
                expected_keywords=[
                    "RICE",
                    "MoSCoW",
                    "user value",
                    "effort",
                    "impact",
                    "data-driven",
                ],
            ),
            QuestionTemplate(
                question="Describe your process for understanding user needs and validating product ideas.",
                difficulty=DifficultyLevel.MEDIUM,
                source=QuestionSource.ROLE_BASED,
                topic="User Research",
                expected_keywords=[
                    "interviews",
                    "surveys",
                    "prototypes",
                    "A/B testing",
                    "analytics",
                    "feedback",
                ],
            ),
            QuestionTemplate(
                question="What metrics would you track for a subscription-based product?",
                difficulty=DifficultyLevel.MEDIUM,
                source=QuestionSource.ROLE_BASED,
                topic="Metrics",
                expected_keywords=[
                    "MRR",
                    "churn",
                    "LTV",
                    "CAC",
                    "retention",
                    "NPS",
                    "activation",
                ],
            ),
            QuestionTemplate(
                question="How do you handle disagreements with engineering about technical feasibility?",
                difficulty=DifficultyLevel.MEDIUM,
                source=QuestionSource.BEHAVIORAL,
                topic="Stakeholder Management",
                expected_keywords=[
                    "collaboration",
                    "trade-offs",
                    "communication",
                    "compromise",
                    "data",
                ],
            ),
            QuestionTemplate(
                question="Design a product strategy for entering a new market with established competitors.",
                difficulty=DifficultyLevel.HARD,
                source=QuestionSource.ROLE_BASED,
                topic="Product Strategy",
                expected_keywords=[
                    "differentiation",
                    "market research",
                    "positioning",
                    "MVP",
                    "go-to-market",
                ],
            ),
        ],
    ),
    "data_scientist": InterviewTemplate(
        id="data_scientist",
        name="Data Scientist",
        role="Data Scientist",
        description="Machine learning, statistics, and data analysis",
        icon="BarChart3",
        includes_coding=True,
        coding_languages=["python"],
        topics=[
            "Machine Learning",
            "Statistics",
            "Data Analysis",
            "Deep Learning",
            "Problem Solving",
        ],
        estimated_duration_minutes=45,
        question_bank=[
            QuestionTemplate(
                question="Explain the bias-variance tradeoff in machine learning.",
                difficulty=DifficultyLevel.EASY,
                source=QuestionSource.TECHNICAL,
                topic="Machine Learning",
                expected_keywords=[
                    "overfitting",
                    "underfitting",
                    "generalization",
                    "complexity",
                    "regularization",
                ],
            ),
            QuestionTemplate(
                question="How would you handle imbalanced classes in a classification problem?",
                difficulty=DifficultyLevel.MEDIUM,
                source=QuestionSource.TECHNICAL,
                topic="Machine Learning",
                expected_keywords=[
                    "SMOTE",
                    "undersampling",
                    "class weights",
                    "precision-recall",
                    "F1 score",
                ],
            ),
            QuestionTemplate(
                question="Explain the difference between L1 and L2 regularization.",
                difficulty=DifficultyLevel.MEDIUM,
                source=QuestionSource.TECHNICAL,
                topic="Machine Learning",
                expected_keywords=[
                    "Lasso",
                    "Ridge",
                    "sparsity",
                    "feature selection",
                    "penalty",
                ],
            ),
            QuestionTemplate(
                question="How would you design an A/B test to measure the impact of a new feature?",
                difficulty=DifficultyLevel.MEDIUM,
                source=QuestionSource.TECHNICAL,
                topic="Statistics",
                expected_keywords=[
                    "hypothesis",
                    "sample size",
                    "statistical significance",
                    "control",
                    "p-value",
                ],
            ),
            QuestionTemplate(
                question="Describe the architecture of a transformer model and why it's effective for NLP.",
                difficulty=DifficultyLevel.HARD,
                source=QuestionSource.TECHNICAL,
                topic="Deep Learning",
                expected_keywords=[
                    "attention",
                    "self-attention",
                    "positional encoding",
                    "parallelization",
                    "BERT",
                    "GPT",
                ],
            ),
        ],
    ),
    "devops_engineer": InterviewTemplate(
        id="devops_engineer",
        name="DevOps Engineer",
        role="DevOps Engineer",
        description="CI/CD, infrastructure, and cloud operations",
        icon="Server",
        includes_coding=True,
        coding_languages=["python", "bash"],
        topics=["CI/CD", "Containers", "Cloud", "Monitoring", "Infrastructure as Code"],
        estimated_duration_minutes=40,
        question_bank=[
            QuestionTemplate(
                question="Explain the difference between Docker containers and virtual machines.",
                difficulty=DifficultyLevel.EASY,
                source=QuestionSource.TECHNICAL,
                topic="Containers",
                expected_keywords=[
                    "kernel",
                    "isolation",
                    "lightweight",
                    "hypervisor",
                    "image",
                    "portability",
                ],
            ),
            QuestionTemplate(
                question="What is the difference between blue-green and canary deployments?",
                difficulty=DifficultyLevel.MEDIUM,
                source=QuestionSource.TECHNICAL,
                topic="CI/CD",
                expected_keywords=[
                    "rollback",
                    "traffic",
                    "risk",
                    "gradual",
                    "testing",
                    "production",
                ],
            ),
            QuestionTemplate(
                question="How would you design a monitoring and alerting system for a microservices architecture?",
                difficulty=DifficultyLevel.HARD,
                source=QuestionSource.TECHNICAL,
                topic="Monitoring",
                expected_keywords=[
                    "Prometheus",
                    "Grafana",
                    "distributed tracing",
                    "logs",
                    "metrics",
                    "SLOs",
                ],
            ),
            QuestionTemplate(
                question="Explain Infrastructure as Code and its benefits. What tools have you used?",
                difficulty=DifficultyLevel.MEDIUM,
                source=QuestionSource.TECHNICAL,
                topic="Infrastructure as Code",
                expected_keywords=[
                    "Terraform",
                    "CloudFormation",
                    "version control",
                    "reproducibility",
                    "drift",
                ],
            ),
        ],
    ),
}


def get_template(template_id: str) -> Optional[InterviewTemplate]:
    """Get an interview template by ID."""
    return TEMPLATES.get(template_id)


def list_templates() -> List[Dict[str, Any]]:
    """List all available templates with summary info."""
    return [
        {
            "id": t.id,
            "name": t.name,
            "role": t.role,
            "description": t.description,
            "icon": t.icon,
            "includes_coding": t.includes_coding,
            "topics": t.topics,
            "estimated_duration_minutes": t.estimated_duration_minutes,
            "question_count": len(t.question_bank),
        }
        for t in TEMPLATES.values()
    ]
