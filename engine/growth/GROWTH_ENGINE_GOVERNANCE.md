📜 Governance Summary (Canonical)

Growth Engine — Governance Contract (V1)
	•	Role:
Projection-only analysis engine answering “What happens if…?”
No recommendations, no actions, no mutation.
	•	Authority Sources:
	•	Portfolio holdings → PORTFOLIO_DERIVED
	•	Starting value → PORTFOLIO_DERIVED
	•	Base allocations → ENGINE_ASSUMPTION
	•	Candidate injection → USER_ASSUMPTION
	•	Computed outputs → ENGINE_COMPUTED
	•	Input Constraints:
	•	Renderer may supply candidateAllocation only
	•	All other inputs are engine-owned or portfolio-derived
	•	Payload schema is allow-listed and validated at runtime
	•	Read-Only Enforcement:
	•	No engine writes to portfolio, snapshots, or state
	•	All objects frozen at IPC boundary
	•	Mutation attempts hard-rejected
	•	Determinism:
	•	Same inputs → same outputs
	•	No randomness, no time entropy in calculations
	•	Timestamp is metadata only (not part of math)
	•	Outputs:
	•	Growth curve (required vs expected)
	•	Sensitivity bars
	•	Candidate Asset Impact table
	•	Clear math explanation block
	•	Status + timestamp always present
	•	Explicitly Not Allowed:
	•	Buy / sell / hold instructions
	•	Forecast guarantees
	•	Optimization or persuasion language
	•	Portfolio mutation

