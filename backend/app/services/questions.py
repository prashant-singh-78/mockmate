from dataclasses import dataclass


@dataclass(frozen=True)
class Question:
    id: str
    prompt: str
    category: str
    keywords: tuple[str, ...]
    guidance: str


QUESTION_BANK: dict[str, list[Question]] = {
    "software engineer": [
        Question("se-1", "Tell me about a technically difficult project you built.", "Communication", ("challenge", "built", "result", "learned"), "Use STAR: explain the situation, your specific responsibility, the technical decisions you made, and a measurable result."),
        Question("se-2", "How would you design an API that must handle sudden traffic spikes?", "System design", ("cache", "queue", "scale", "database", "monitor"), "Clarify requirements, separate stateless services, add caching and queues, protect the database, and explain monitoring and trade-offs."),
        Question("se-3", "Describe a production bug you diagnosed and fixed.", "Problem solving", ("reproduce", "logs", "root cause", "test", "prevent"), "Walk through reproduction, evidence, root cause, the smallest safe fix, verification, and prevention."),
        Question("se-4", "When would you choose SQL over NoSQL?", "Fundamentals", ("transaction", "schema", "consistency", "query", "trade-off"), "Compare data shape, transactions, query patterns, consistency, scaling, and operational maturity rather than naming a universal winner."),
        Question("se-5", "How do you make code ready for production?", "Engineering", ("test", "security", "observability", "review", "deploy"), "Cover automated tests, reviews, secure configuration, CI/CD, observability, rollback, and documentation."),
    ],
    "data scientist": [
        Question("ds-1", "Tell me about a machine-learning project and its real outcome.", "Communication", ("problem", "data", "model", "metric", "impact"), "Connect the business problem to data, baselines, model choice, evaluation, and a real outcome."),
        Question("ds-2", "How would you handle an imbalanced classification dataset?", "Modeling", ("metric", "sampling", "weight", "precision", "recall"), "Start with the cost of errors, choose suitable metrics, then discuss weighting or sampling and validation without leakage."),
        Question("ds-3", "A model performs well offline but poorly in production. What do you check?", "MLOps", ("drift", "pipeline", "feature", "latency", "monitor"), "Check training-serving skew, drift, pipeline correctness, segments, latency, thresholds, and monitoring."),
        Question("ds-4", "Explain overfitting to a non-technical stakeholder.", "Communication", ("example", "memorize", "generalize", "validation"), "Use a simple analogy, explain why unseen data matters, and name practical controls without unnecessary jargon."),
        Question("ds-5", "How do you evaluate whether a model should be deployed?", "Evaluation", ("baseline", "metric", "cost", "fairness", "monitor"), "Compare against a baseline and business threshold, evaluate slices and risk, then define monitoring and rollback."),
    ],
    "product manager": [
        Question("pm-1", "Tell me about a product decision you made with incomplete information.", "Judgment", ("goal", "data", "trade-off", "decision", "result"), "Frame the goal, uncertainty, evidence, trade-offs, decision, and what changed after learning more."),
        Question("pm-2", "How would you prioritize a crowded feature backlog?", "Prioritization", ("outcome", "user", "impact", "effort", "risk"), "Anchor on product outcomes, combine user evidence with impact, effort, risk, and dependencies, and explain communication."),
        Question("pm-3", "A key metric drops 20% overnight. What do you do?", "Analytics", ("validate", "segment", "funnel", "cause", "response"), "Validate the data, segment the change, inspect the funnel and releases, form hypotheses, and coordinate a proportionate response."),
        Question("pm-4", "How do you work through disagreement with engineering?", "Collaboration", ("goal", "constraint", "listen", "trade-off", "decision"), "Re-establish the shared goal, surface constraints, explore options, document the trade-off, and commit to a decision."),
        Question("pm-5", "How would you measure the success of a new onboarding flow?", "Metrics", ("activation", "completion", "retention", "segment", "guardrail"), "Define the target behavior, activation and completion metrics, downstream retention, segments, and guardrails."),
    ],
}


def normalize_role(role: str) -> str:
    value = role.strip().lower()
    return value if value in QUESTION_BANK else "software engineer"


def get_questions(role: str) -> list[Question]:
    return QUESTION_BANK[normalize_role(role)]


def get_question(role: str, question_id: str) -> Question:
    return next(question for question in get_questions(role) if question.id == question_id)

