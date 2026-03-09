"""Session manager for interview sessions with caching and persistence."""

from datetime import datetime
from typing import Dict, List, Optional

from app.models.interview.enums import InterviewEventType, InterviewStatus
from app.models.interview.schemas import (
    CandidateProfile,
    InterviewConfig,
    InterviewEvent,
    InterviewSession,
)


class SessionManager:
    """Manages interview sessions with in-memory caching.

    For production, this can be extended to persist to PostgreSQL
    via the Next.js API routes or directly using asyncpg.
    """

    def __init__(self):
        # In-memory session storage
        self._sessions: Dict[str, InterviewSession] = {}
        # In-memory event storage
        self._events: Dict[str, List[InterviewEvent]] = {}

    async def create(
        self,
        profile: CandidateProfile,
        config: InterviewConfig,
    ) -> InterviewSession:
        """Create a new interview session.

        Args:
            profile: Candidate profile information
            config: Interview configuration

        Returns:
            New InterviewSession instance
        """
        session = InterviewSession(
            profile=profile,
            config=config,
            status=InterviewStatus.PENDING,
            created_at=datetime.utcnow(),
        )

        self._sessions[session.session_id] = session
        self._events[session.session_id] = []

        return session

    async def get(self, session_id: str) -> Optional[InterviewSession]:
        """Get a session by ID.

        Args:
            session_id: The session ID to look up

        Returns:
            InterviewSession if found, None otherwise
        """
        return self._sessions.get(session_id)

    async def save(self, session: InterviewSession) -> None:
        """Save/update a session.

        Args:
            session: The session to save
        """
        self._sessions[session.session_id] = session

    async def delete(self, session_id: str) -> bool:
        """Delete a session.

        Args:
            session_id: The session ID to delete

        Returns:
            True if deleted, False if not found
        """
        if session_id in self._sessions:
            del self._sessions[session_id]
            if session_id in self._events:
                del self._events[session_id]
            return True
        return False

    async def list_sessions(
        self,
        status: Optional[InterviewStatus] = None,
        limit: int = 100,
    ) -> List[InterviewSession]:
        """List sessions with optional filtering.

        Args:
            status: Optional status filter
            limit: Maximum number of sessions to return

        Returns:
            List of matching sessions
        """
        sessions = list(self._sessions.values())

        if status:
            sessions = [s for s in sessions if s.status == status]

        # Sort by created_at descending
        sessions.sort(key=lambda s: s.created_at, reverse=True)

        return sessions[:limit]

    async def record_event(self, event: InterviewEvent) -> None:
        """Record an interview event.

        Args:
            event: The event to record
        """
        session_id = event.session_id

        if session_id not in self._events:
            self._events[session_id] = []

        self._events[session_id].append(event)
        session = self._sessions.get(session_id)
        if session:
            session.events.append(event.model_dump())

        # Update session event count if it's a tab switch
        if event.event_type == InterviewEventType.TAB_SWITCH:
            if session:
                session.tab_switch_count += 1

    async def get_events(
        self,
        session_id: str,
        event_type: Optional[InterviewEventType] = None,
    ) -> List[InterviewEvent]:
        """Get events for a session.

        Args:
            session_id: The session ID
            event_type: Optional event type filter

        Returns:
            List of matching events
        """
        events = self._events.get(session_id, [])

        if event_type:
            events = [e for e in events if e.event_type == event_type]

        return events

    async def count_events(
        self,
        session_id: str,
        event_type: InterviewEventType,
    ) -> int:
        """Count events of a specific type.

        Args:
            session_id: The session ID
            event_type: The event type to count

        Returns:
            Number of matching events
        """
        events = await self.get_events(session_id, event_type)
        return len(events)

    async def start_interview(self, session_id: str) -> Optional[InterviewSession]:
        """Mark an interview as started.

        Args:
            session_id: The session ID

        Returns:
            Updated session or None if not found
        """
        session = await self.get(session_id)
        if session:
            session.status = InterviewStatus.IN_PROGRESS
            session.started_at = datetime.utcnow()
            await self.save(session)
        return session

    async def complete_interview(self, session_id: str) -> Optional[InterviewSession]:
        """Mark an interview as completed.

        Args:
            session_id: The session ID

        Returns:
            Updated session or None if not found
        """
        session = await self.get(session_id)
        if session:
            session.status = InterviewStatus.COMPLETED
            session.completed_at = datetime.utcnow()
            await self.save(session)
        return session

    async def cancel_interview(self, session_id: str) -> Optional[InterviewSession]:
        """Mark an interview as cancelled.

        Args:
            session_id: The session ID

        Returns:
            Updated session or None if not found
        """
        session = await self.get(session_id)
        if session:
            session.status = InterviewStatus.CANCELLED
            await self.save(session)
        return session

    def get_session_count(self) -> int:
        """Get the total number of sessions in memory."""
        return len(self._sessions)

    async def cleanup_old_sessions(self, max_age_hours: int = 24) -> int:
        """Remove sessions older than max_age_hours.

        Args:
            max_age_hours: Maximum age in hours

        Returns:
            Number of sessions removed
        """
        now = datetime.utcnow()
        removed = 0

        session_ids = list(self._sessions.keys())
        for session_id in session_ids:
            session = self._sessions[session_id]
            age = (now - session.created_at).total_seconds() / 3600

            if age > max_age_hours:
                await self.delete(session_id)
                removed += 1

        return removed


# Global session manager instance
_session_manager: Optional[SessionManager] = None


def get_session_manager() -> SessionManager:
    """Get the global session manager instance."""
    global _session_manager
    if _session_manager is None:
        _session_manager = SessionManager()
    return _session_manager
