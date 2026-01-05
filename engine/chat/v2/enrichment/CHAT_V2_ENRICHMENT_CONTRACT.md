# CHAT_V2_ENRICHMENT_CONTRACT
================================

Phase: 14.1  
Status: CONTRACT-ONLY (NO EXECUTION)  
Authority: ENGINE  
Mode: READ-ONLY  

---

## PURPOSE

This contract defines the **Chat V2 Enrichment Layer**.

Enrichment engines:
- Add structured context
- Do NOT decide
- Do NOT advise
- Do NOT execute
- Do NOT mutate state

They exist to **inform downstream intelligence, reasoning, and synthesis**.

This layer enables *god-mode context*, not god-mode action.

---

## DESIGN PRINCIPLES

1. Multiple enrichment engines may run together
2. No enrichment engine is authoritative on its own
3. All outputs are additive and optional
4. Failure of one enrichment must not break Chat V2
5. Enrichment ≠ analysis ≠ reasoning ≠ execution

---

## ENRICHMENT CATEGORIES (NON-EXHAUSTIVE)

The following enrichment types are supported:

### 1. Portfolio Enrichment
- Concentration metrics
- Exposure summaries
- Structural observations

### 2. Risk Enrichment
- Risk regime descriptors
- Volatility context
- Correlation signals

### 3. Market Enrichment
- Macro regime context
- Liquidity conditions
- Sentiment descriptors

### 4. Temporal Enrichment
- Time-horizon framing
- Short vs long-term relevance
- Regime persistence indicators

Each category may have **zero or more engines**.

---

## EXPECTED INPUT (FROM ORCHESTRATOR)

```ts
{
  query: string,
  intent: string,
  portfolioSnapshot: object | null,
  context: object | null
}
