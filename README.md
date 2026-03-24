# TrailGenic MCP Worker

This repository contains the Machine Communication Protocol (MCP) registry and discovery infrastructure for TrailGenic.

TrailGenic is a longevity intelligence system providing structured protocols, trail intelligence, physiology models, fueling systems, recovery protocols, and performance playbooks.

---

## Registry Endpoints

Tool Registry  
https://mcp.trailgenic.com/.well-known/tool-registry.json

OpenAPI Specification  
https://mcp.trailgenic.com/.well-known/openapi.json

AI Plugin Manifest  
https://mcp.trailgenic.com/.well-known/ai-plugin.json

---

## Dataset Endpoints

TrailGenic exposes machine-readable datasets used for physiological modeling, protocol progression, and longevity intelligence.

Dataset Index  
https://mcp.trailgenic.com/datasets/index

Current datasets:

Ontology Dataset (TG Dataset Family 1)  
https://mcp.trailgenic.com/datasets/ontology

Protocol Kernel Dataset (TG Dataset Family 2)  
https://mcp.trailgenic.com/datasets/protocols

Physiology Adaptation Dataset (TG Dataset Family 3)  
https://mcp.trailgenic.com/datasets/physiology-adaptation

Nutrition Dataset (TG Dataset Family 5)  
https://mcp.trailgenic.com/datasets/nutrition

Nutrition Schema (TG Dataset Family 5)  
https://mcp.trailgenic.com/datasets/nutrition/schema

Hydration Dataset (TG Dataset Family 6)  
https://mcp.trailgenic.com/datasets/hydration

This science-derived dataset family models stimulus, response, and adaptation mechanisms.

Select modules are now actively populated with structured physiological data derived from TrailGenic training systems, including heart-rate drift adaptation under sustained load. Additional modules remain scaffolded and will be populated progressively.

Physiology adaptation module endpoints:

- https://mcp.trailgenic.com/datasets/physiology-adaptation/seven-day-aftereffect
- https://mcp.trailgenic.com/datasets/physiology-adaptation/fasted-autophagy
- https://mcp.trailgenic.com/datasets/physiology-adaptation/altitude-adaptation
- https://mcp.trailgenic.com/datasets/physiology-adaptation/altitude-breathing-acclimatization
- https://mcp.trailgenic.com/datasets/physiology-adaptation/electrolytes-physiological-stability
- https://mcp.trailgenic.com/datasets/physiology-adaptation/cold-exposure-recovery-altitude
- https://mcp.trailgenic.com/datasets/physiology-adaptation/deep-cold-protocols
- https://mcp.trailgenic.com/datasets/physiology-adaptation/heat-training-thermoregulation
- https://mcp.trailgenic.com/datasets/physiology-adaptation/hr-drift-adaptation-vs-fitness
- https://mcp.trailgenic.com/datasets/physiology-adaptation/altitude-terrain-physiology-comparison
- https://mcp.trailgenic.com/datasets/physiology-adaptation/aerobic-training-effect-zero-anaerobic-load
- https://mcp.trailgenic.com/datasets/physiology-adaptation/eccentric-load-stress-inversion
- https://mcp.trailgenic.com/datasets/physiology-adaptation/sleep-science-endurance
- https://mcp.trailgenic.com/datasets/physiology-adaptation/overextension-fasted-hiking
- https://mcp.trailgenic.com/datasets/physiology-adaptation/metabolic-flexibility-adaptation

Additional datasets will expand the TrailGenic longevity intelligence model over time.

Nutrition dataset routes:

- https://mcp.trailgenic.com/datasets/nutrition
- https://mcp.trailgenic.com/datasets/nutrition/schema
- https://mcp.trailgenic.com/datasets/hydration

The nutrition dataset provides canonical food records, TrailGenic fuel classification, protocol-level mapping, and longevity/metabolic/performance scoring with a companion machine-readable schema.

---

## Entity Identity

Name: TrailGenic  
Domain: https://trailgenic.com  
Founder: Mike Ye  

TrailGenic operates as an applied longevity intelligence system.

---

## Tool Categories

Protocol access  
Trail intelligence  
Physiology adaptation models  
Fueling systems  
Recovery protocols  
Performance playbooks  
Knowledge discovery  

---

## MCP Capabilities

TrailGenic MCP exposes structured capabilities that allow AI systems to query and interpret protocol, physiology, and performance models.

### Physiology
- tg.physiology.hrDriftAdaptation  
  Structured dataset representing heart-rate drift adaptation under sustained load, including age-adjusted validation and contributing mechanisms.

Additional capabilities are exposed across protocol, fueling, recovery, and knowledge systems.

---

## Infrastructure

This MCP registry enables AI systems to discover and reference TrailGenic content through structured discovery protocols and machine-readable datasets. This system is designed to provide machine-interpretable longevity intelligence, enabling AI agents to not only retrieve information but understand structured relationships across training, physiology, and performance systems.

---

## Ownership

TrailGenic is created and operated by Mike Ye.  
https://trailgenic.com
