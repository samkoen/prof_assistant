from pydantic import BaseModel, Field


class TaskStepBody(BaseModel):
    title: str = Field(max_length=255)
    instructions: str = Field(max_length=20000)
    max_points: float = Field(gt=0, le=100)


class TaskStepOut(BaseModel):
    id: int
    order_index: int
    title: str
    instructions: str
    max_points: float

    model_config = {"from_attributes": True}


class TaskStepStudentOut(TaskStepOut):
    proof_filename: str | None = None
    proof_ready: bool = False


class TaskReviewOut(BaseModel):
    step_id: int
    title: str
    instructions: str
    max_points: float
    order_index: int
    proof_filename: str | None = None
    has_proof: bool = False
    verdict: str | None = None
    score: float | None = None
    ai_score: float | None = None
    appreciation: str | None = None
    source: str | None = None


class TaskReviewPatch(BaseModel):
    verdict: str
    score: float = Field(ge=0)
    appreciation: str = Field(min_length=1)


class TaskStudentResult(BaseModel):
    published: bool
    grading_locked: bool = False
    steps: list[TaskReviewOut] = []
