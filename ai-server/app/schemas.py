from pydantic import BaseModel, Field
from typing import Any


class IdeaToProjectRequest(BaseModel):
    idea: str = Field(..., min_length=1)


class WeeklyPlanRequest(BaseModel):
    goals: list[Any] = Field(default_factory=list)
    tasks: list[Any] = Field(default_factory=list)


class AdvisorNoteRequest(BaseModel):
    stats: dict[str, Any]
    completedToday: int = 0


class BudgetAdviceRequest(BaseModel):
    salary: float
    profile: dict[str, Any]
    categories: list[dict[str, Any]]


class FinancialPlanRequest(BaseModel):
    questionnaire: dict[str, Any]
    categories: list[dict[str, Any]]


class FinanceHealthRequest(BaseModel):
    transactions: list[dict[str, Any]]
    categories: list[dict[str, Any]]
    salary: float

