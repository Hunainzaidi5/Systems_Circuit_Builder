# ⚡ Circuit Lab — Industrial Systems Builder

A browser-based, drag-and-drop simulator for building and running electrical, hydraulic, gas, steam, HVAC, engine and power-generation systems. It is pure HTML, CSS and JavaScript: no build step, no dependencies and no server.

> **Educational model only.** It does not measure or control real equipment. Always verify real wiring against manufacturer diagrams and local code, and use correctly rated protection.

## Features

- **Large searchable component library:** AC/DC and 3-phase power, protection devices, relays and contactors, PLC/VFD/soft starters, motors, transformers, UPS, solar/wind, LiFePO4 battery banks with BMS, hybrid inverters and ATS
- **Test and protection gear:** digital multimeter (AUTO / V AC / V DC / Ω / continuity with beeper / diode), series AC and DC V·A·W meters with energy and alarm contacts, thermal-magnetic AC/DC breakers with shunt trip and aux contacts, and 1-phase isolation, 3-phase Dyn11 and HV transformers with taps, regulation, losses and thermal protection
- **Process and fluids:** pumps, tanks, valves, hydraulic cylinders and motors, ISO-style spool valves, instruments and transmitters for pressure, flow, level, temperature, pH, conductivity and gas detection
- **Power-system analysis:** electrical union-find nets, DC nodal solver, prospective fault levels, IEC inverse-time curves, AC bus voltage/cable-drop estimates, generator synchronising and paralleling, 4–20 mA AI/AO loops, Modbus slave/master
- **Fluids and thermal systems:** hydraulic flow and nodal pressure, pump curves, NPSH/cavitation and water-hammer estimates; gas, steam, air and flue propagation; IAPWS steam properties and psychrometrics
- **HVAC:** refrigerant components, TXV/EEV, compressor, condenser, evaporator, chiller, AHU, fan coil, zones, thermostat and airflow/refrigerant animation
- **Engines, motion and industrial controls:** engine/genset models, couplings, gear/belt/chain drives, turbocharger, cooling loop, thermocouple/RTD, sensors, encoders, servo/stepper drives, terminal blocks, HMI and PLC
- **Editor:** orthogonal wire/pipe routing with obstacle avoidance, draggable bend nodes and segment handles, marquee selection, pin labels/hover details, schematic-symbol mode, undo/redo, duplicate, rotate, delete, autosave and JSON save/load
- **Learning and review tools:** live KPIs/readouts, scope, event log, fault diagnostics (names and highlights faulty parts and traces short circuits), challenges, PNG/BOM/netlist CSV export and trend recording
- **Ready-made templates:** Float-pump, 3-Φ distribution, CoGen (gas turbine + HRSG + steam turbine), HVAC DX split, Control-panel I/O and Engine-genset

## Run

1. Download or clone the repository.
2. Open `index.html` in a modern browser (Chrome, Edge, Firefox or a current mobile browser).

```bash
git clone https://github.com/Hunainzaidi5/Systems_Circuit_Builder
cd Systems_Circuit_Builder
# then open index.html (double-click it, or serve it)
python -m http.server 8000   # optional: http://localhost:8000
```

Keep `index.html`, `styles.css` and the `scripts/` folder together.

## Project structure

```
Systems_Circuit_Builder/
├── index.html        # page layout and script references
├── styles.css        # all styling (dark/light theme, panels, palette)
├── scripts/          # 45 classic scripts loaded in the order below
│   ├── 01-script.js
│   ├── …
│   ├── 43-script.js
│   ├── 44-script.js
│   └── 45-script.js
├── README.md
├── LICENSE
└── gitignore
```

The scripts are classic (non-module) scripts and **must load in the exact order listed in `index.html`**. Later files extend and wrap functions defined by earlier ones; the order is not strictly numeric because `34-script.js` loads before `23-script.js` so later modules can use the component registry and UX hooks.

| Load order | Responsibility |
|---|---|
| 01 | Core state, component definitions (`DEFS`), circuit/hydraulic solvers, canvas renderer, palette, properties panel, undo/persistence and toolbar |
| 02 | SVG icons, fluid/electron flow animation and live scope |
| 03 | Realistic redraws for turbines, boilers, gas/steam equipment and protection gear |
| 04 | Fluid compatibility, process network (gas/steam/water/air/flue), turbine spool-up and process equipment power checks |
| 05 | Process dynamics and multi-service instrument measurements |
| 06 | Fluid properties, static head, service-aware instruments and component footer |
| 07 | Light/dark theme, 3-phase power model and monitor, VFD/soft-start, hybrid inverter models and 3-Φ template |
| 08 | Process-sensor configuration, calibration, alarms and simulated faults |
| 09 | Fail-safe sensor interlocks, burner/flame auxiliary supply, motor nameplate controls and thermal transfer |
| 10 | Reference-style motor visuals, downward burner/flame and thermal plume |
| 11–12 | Motor palette and rotor-animation/stability patches |
| 13 | Gas/steam booster pumps, air supply and flue-stack behaviour |
| 14 | Series battery-bank mirroring, charge/discharge sharing and loop-wiring detection |
| 15 | HRSG model and CoGen template |
| 16–17 | HVAC library, refrigeration/airflow animation and HVAC template |
| 18 | Industrial I/O, sensors/encoders, motion control, switchgear, UPS, engines and cooling loop |
| 19 | Obstacle-aware orthogonal A* wire/pipe routing |
| 20 | Templates menu, dockable side panels, collapsible palette categories and canvas HUD |
| 21 | Hydraulic actuators, encoder controller, HMI, PLC, tachometer and turbocharger |
| 22 | Pin overlay, pin descriptions/hover card, pinout table and wire/pipe marquee selection |
| 34 | Unified `COMP` component registry, `def2()` extension point, palette insertion and UX hooks (see below) |
| 23 | Protection relays, synchronising/paralleling, governor/exciter/AVR, 4–20 mA AI/AO loops and safety trips |
| 24 | IAPWS-style steam tables and psychrometric calculations |
| 25 | Save v2, PNG/BOM/netlist exports, trend recorder and wire numbers |
| 26 | `buildUF()` result cache for union-find topology |
| 27 | Live challenge-mode panel |
| 28 | Per-node hydraulic pressure profile along pump runs |
| 29 | DC nodal solver for 24 V controls, batteries and cable drop |
| 30 | Prospective fault levels and IEC inverse-time overcurrent curve |
| 31 | AC bus voltage and cable-drop estimates |
| 32 | Hydraulic nodal pressure solver with pump curves, valves and boundaries |
| 33 | Joukowsky water-hammer estimates |
| 35 | Touch/pinch zoom |
| 36 | IEC-style schematic-symbol display mode |
| 37 | Fault-injection state/helpers for fuses, valves, sensors and bus shorts |
| 38 | Centrifugal pump curve and NPSH/cavitation analysis |
| 39 | Motor starters, protection relays, MCCB, diode bridge, bus-tie, paralleling panel and test instruments |
| 40 | Process/control parts: orifice/DP, control valve, heat exchanger, flash tank, desuperheater, steam header, air receiver, boiler drum control, PID/ratio/split-range controllers and Modbus |
| 41 | Shared schematic glyphs for newer parts and sidebar collapse-all control |
| 42 | Redesigned graphics/terminal layout for newer parts plus collapsible sidebar/palette controls |
| 43 | Component library re-categorisation into clean ordered groups |
| 44 | Electrically powered, animated Air Supply; fault diagnostics (fault list, short-circuit tracing, board highlights); left-panel group tinting |
| 45 | Root-cause fixes and library clean-up (SPD/Pipe Support/Reactor/Flash Tank init keys, CT/VT/generic transformer/solenoid removed, old-board migration), digital multimeter, AC/DC V·A·W meters, thermal-magnetic AC/DC breakers and 1Φ/3Φ Dyn11/HV transformer models |

### Component registry & extension points

`scripts/34-script.js` is the migration target for new components. It keeps `DEFS` as the runtime authority while exposing a canonical registry and a small set of helpers:

- **`window.COMP`** — one record per component type, populated lazily from `DEFS` and the global maps. Fields include `type`, `name`, `tag`, `cat`, `icon`, `w`, `h`, `term`, `pins`, `init`, capability flags (`links`, `draw`, `iconSvg`) and `blurb`.
- **`window.def2(type, spec)`** — define a new part. The `spec` object accepts `name`, `tag`, `cat`, `w`, `h`, `icon`, `pins`, `term`, `init`, `links`, `draw`, `tick`, `props`, `desc`, `blurb` and `click`. `def2` updates `DEFS`, wires `LINKS`/`DRAW`/`ICON`/`COMP_BLURB`, registers a `Game` tick for `tick`, appends the part to the palette, and returns the `COMP` record.
- **`window.COMP_LIST(cat)`** — return registry records for all parts, optionally filtered by category.
- **UX hooks** — `uxDesc(fn)`, `uxProps(fn)`, `uxClick(fn)` and `uxStep(fn)` register callbacks on `window.UX`. The hooks run in registration order after the base `describe`, `renderProps`, `clickAction` and `step` implementations, replacing the older ad-hoc `const _x = fn; fn = function(){ _x(); ... }` wrapping pattern. A `uxClick` hook that returns `true` consumes the click and prevents the base handler from running.

## Controls

| Action | Control |
|---|---|
| Add a part | Drag from the palette, or click it |
| Wire / pipe | Click a terminal, optionally click to place bends, click the target terminal. Round = wire, square = pipe; right-click cancels wiring |
| Shape a wire/pipe | Select it, then drag bend nodes or segment handles, or double-click a segment to insert a bend |
| Pan / zoom | Middle-mouse drag / mouse wheel; toolbar buttons and **Fit** are also available; touch devices support drag and pinch zoom |
| Select parts | Shift+click, or drag a box on empty canvas |
| Select wires/pipes | Drag a marquee over them; hold Shift to add to the current selection; Shift+click toggles one |
| Rotate / duplicate / delete | `R` / `Ctrl+D` / `Delete` or `Backspace` |
| Undo / redo | `Ctrl+Z` / `Ctrl+Shift+Z` or `Ctrl+Y` |
| Select all / clear | `Ctrl+A` / `Esc` |
| Display modes | **Sym** toggles IEC-style symbols; **Pins** cycles pin labels/details; sidebar and palette cards can be collapsed |

The board autosaves to the browser's `localStorage`. Use **Save** / **Load** to export or import a `.json` circuit. Additional toolbar controls export PNG, BOM and netlist CSV files and record/export trend data.

## Contributing

Issues and pull requests are welcome. Please test changes in a browser (syntax checks alone do not exercise the simulator) and keep the script load order intact.

## License

Released under the [MIT License](LICENSE).
