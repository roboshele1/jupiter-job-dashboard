# JUPITER V2 — Event Ledger

Status: **ACTIVE / FROZEN CONTRACT**

## Purpose
This ledger is the backbone of Jupiter V2 intelligence.

It records **what happened**, **when**, and **why** — without mutation.

## Properties
- Append-only (NDJSON)
- Deterministic schema
- Read-only by default
- Safe for replay, audit, learning

## What belongs here
- App lifecycle events
- Snapshot captures
- Engine outputs
- User intents (read-only)
- System annotations

## What does NOT belong here
- UI state
- Temporary calculations
- Predictions
- Actions or trades

Once written, events are never edited.

This is Jupiter’s memory.

