'use strict';
const $=id=>document.getElementById(id);
const GRID=10;
const COL={body:'#13233a',edge:'#4a6a8a',text:'#dbe8f7',mut:'#8aa3bf',live:'#ff9f1c',neu:'#4da6ff',pe:'#2ec4b6',ok:'#06d6a0',bad:'#ef476f',warn:'#ffd166',off:'#5b7089'};

/* ───────────── component library ───────────── */
// terminal: [id, x, y, dirx, diry]
const DEFS={
  source:{name:'AC Source',tag:'G',icon:'⚡',cat:'Electrical Power',w:100,h:80,term:[['L',50,-20,1,0],['N',50,0,1,0],['PE',0,40,0,1]],init:{on:true,volts:220}},
  mcb:{name:'MCB 2P',tag:'QF',icon:'🔌',cat:'Electrical Protection',w:80,h:80,term:[['Lin',-40,-20,-1,0],['Nin',-40,20,-1,0],['Lout',40,-20,1,0],['Nout',40,20,1,0]],init:{closed:true,tripped:false,rating:16,heat:0}},
  acbreaker:{name:'AC Breaker 2P',tag:'ACB',icon:'⚡',cat:'Electrical Protection',w:90,h:90,term:[['L_in',-45,-25,-1,0],['N_in',-45,25,-1,0],['L_out',45,-25,1,0],['N_out',45,25,1,0]],init:{closed:true,tripped:false,rating:16,volts:230,heat:0}},
  dcbreaker:{name:'DC Breaker 2P',tag:'DCB',icon:'🔋',cat:'Electrical Protection',w:90,h:90,term:[['+_in',-45,-25,-1,0],['-_in',-45,25,-1,0],['+_out',45,-25,1,0],['-_out',45,25,1,0]],init:{closed:true,tripped:false,rating:20,volts:24,heat:0}},
  rcd:{name:'RCD 30mA',tag:'RCD',icon:'⚠️',cat:'Electrical Protection',w:80,h:80,term:[['Lin',-40,-20,-1,0],['Nin',-40,20,-1,0],['Lout',40,-20,1,0],['Nout',40,20,1,0]],init:{closed:true,tripped:false,ma:30}},
  overload:{name:'Overload',tag:'FR',icon:'🛡️',cat:'Electrical Protection',w:80,h:44,term:[['in',-40,0,-1,0],['out',40,0,1,0]],init:{setting:6,tripped:false,heat:0}},
  float:{name:'Float Switch',tag:'FS',icon:'🎈',cat:'Process Control',w:90,h:80,term:[['COM',-45,0,-1,0],['NC',45,-20,1,0],['NO',45,20,1,0]],init:{mode:'auto',up:false,stop:92,restart:12,fault:'none'}},
  contactor:{name:'Contactor',tag:'KM',icon:'🧲',cat:'Process Control',w:140,h:120,term:[['L1',-30,-60,0,-1],['L2',30,-60,0,-1],['T1',-30,60,0,1],['T2',30,60,0,1],['A1',70,-20,1,0],['A2',70,20,1,0],['13',-70,-20,-1,0],['14',-70,20,-1,0]],init:{coilOn:false,fault:'none'}},
  switch:{name:'Switch',tag:'SA',icon:'🔘',cat:'Process Control',w:80,h:40,term:[['a',-40,0,-1,0],['b',40,0,1,0]],init:{closed:false}},
  pb:{name:'Push Button',tag:'SB',icon:'⏺️',cat:'Process Control',w:70,h:60,term:[['a',-35,0,-1,0],['b',35,0,1,0]],init:{nc:false,pressed:false}},
  motor:{name:'Pump + Motor',tag:'M',icon:'⚙️',cat:'Hydraulic Loads',w:120,h:120,term:[['L',-60,-25,-1,0],['N',-60,0,-1,0],['PE',0,60,0,1],['DIS',60,-25,1,0,'h'],['SUC',60,25,1,0,'h']],init:{hp:1,pf:0.8,eff:0.75,inrush:4.5,fault:'none',pump:true,ang:0,startT:0,powered:false,cutout:false,dryHeat:0,pressure:0,temperature:20}},
  gearpump:{name:'Gear Pump (Custom)',tag:'GP',icon:'⚙️',cat:'Hydraulic Loads',w:150,h:140,term:[['SUC',-75,-25,-1,0,'h'],['DIS',75,-25,1,0,'h'],['SHAFT',0,-70,0,-1],['L',-45,65,-1,0],['N',-15,65,-1,0],['PE',15,70,0,1]],init:{hp:2.5,pf:0.85,eff:0.7,inrush:3,fault:'none',pump:true,ang:0,startT:0,powered:false,cutout:false,dryHeat:0,pressure:0,temperature:20,flowK:2,headK:2.4,rpm:0,I:0,drive:'none',spin:0}},
  silo:{name:'Silo Tank',tag:'SL',icon:'🛢️',cat:'Hydraulic',w:160,h:330,term:[['IN',-80,40,-1,0,'h'],['OUT',80,40,1,0,'h']],init:{level:35,drain:0,overflow:false,pressure:0,outletRestriction:30,temperature:20}},
  silopump:{name:'Silo Tank + Pump',tag:'SLP',icon:'🛢️',cat:'Hydraulic',w:160,h:330,term:[['IN',-80,40,-1,0,'h'],['OUT',-80,110,-1,0,'h'],['DIS',80,110,1,0,'h'],['L',-50,160,-1,0],['N',-20,160,-1,0],['PE',10,165,0,1]],init:{level:35,drain:0,overflow:false,pressure:0,outletRestriction:30,temperature:20,hp:3,pf:0.85,eff:0.72,inrush:3,fault:'none',pump:true,ang:0,startT:0,powered:false,cutout:false,dryHeat:0,flowK:1.4,headK:1.2,rpm:0,I:0,spin:0}},
  acmotor:{name:'Single-Phase AC Motor',tag:'M1',icon:'⚙️',cat:'Electrical Loads',w:110,h:100,term:[['L',-55,-20,-1,0],['N',-55,20,-1,0],['PE',0,50,0,1]],init:{hp:1,pf:0.8,eff:0.75,inrush:5,fault:'none',ang:0,startT:0,powered:false,rpm:0,I:0}},
  dcmotor:{name:'DC Motor',tag:'MD',icon:'⚙️',cat:'Electrical Loads',w:110,h:100,term:[['+',-55,-20,-1,0],['-',-55,20,-1,0]],init:{watts:500,volts:24,eff:0.8,inrush:3,fault:'none',ang:0,startT:0,powered:false,rpm:0,I:0,speedPct:100}},

  lamp:{name:'Lamp',tag:'H',icon:'💡',cat:'Electrical Loads',w:60,h:60,term:[['a',0,-30,0,-1],['b',0,30,0,1]],init:{watts:60,fault:'none',powered:false}},
  junction:{name:'Junction',tag:'J',icon:'✖️',cat:'Electrical Wiring',w:30,h:30,term:[['t',0,-15,0,-1],['r',15,0,1,0],['b',0,15,0,1],['l',-15,0,-1,0]],init:{}},
  tank:{name:'Water Tank',tag:'TK',icon:'🛢️',cat:'Hydraulic',w:140,h:180,term:[['IN',-70,50,-1,0,'h'],['OUT',70,60,1,0,'h']],init:{level:24,drain:0,overflow:false,pressure:0,outletRestriction:30}},
  sump:{name:'Water Source',tag:'WS',icon:'🌊',cat:'Hydraulic',w:120,h:80,term:[['OUT',-60,0,-1,0,'h']],init:{level:100,unlimited:true,refill:0.3}},
  tee:{name:'Pipe Tee',tag:'PT',icon:'┳',cat:'Hydraulic',w:30,h:30,term:[['t',0,-15,0,-1,'h'],['r',15,0,1,0,'h'],['b',0,15,0,1,'h'],['l',-15,0,-1,0,'h']],init:{}},
  valve:{name:'Control Valve',tag:'CV',icon:'🔧',cat:'Hydraulic',w:60,h:40,term:[['a',-30,0,-1,0,'h'],['b',30,0,1,0,'h']],init:{open:true,flowPercent:25}},
  tap:{name:'Tap / Consumer',tag:'TP',icon:'🚿',cat:'Hydraulic',w:60,h:50,term:[['IN',-30,0,-1,0,'h']],init:{open:true,flow:0.5,running:false}},
  gauge:{name:'Pressure Gauge',tag:'PG',icon:'📊',cat:'Process Instrument',w:60,h:60,term:[['IN',-30,0,-1,0,'h']],init:{pressure:0,unit:'bar',max:10,service:'auto',fluid:'none'}},
  flowmeter:{name:'Flow Meter',tag:'FM',icon:'📈',cat:'Process Instrument',w:70,h:50,term:[['IN',-35,0,-1,0,'h'],['OUT',35,0,1,0,'h']],init:{flow:0,unit:'L/min',total:0,service:'auto',fluid:'none'}},
  tempgauge:{name:'Temp Gauge',tag:'TG',icon:'🌡️',cat:'Process Instrument',w:60,h:60,term:[['IN',-30,0,-1,0,'h']],init:{temperature:20,unit:'°C',max:100,service:'auto',fluid:'none'}},
  levelgauge:{name:'Level Gauge',tag:'LG',icon:'▥',cat:'Process Instrument',w:70,h:80,term:[['IN',-35,0,-1,0,'h']],init:{level:0,max:100,unit:'%',service:'auto',fluid:'none'}},
  dpgauge:{name:'Differential Pressure Gauge',tag:'DPG',icon:'↕',cat:'Process Instrument',w:80,h:70,term:[['HI',-40,-15,-1,0,'h'],['LO',-40,15,-1,0,'h']],init:{pressure:0,max:10,unit:'bar',service:'auto',fluid:'none'}},
  vacuumgauge:{name:'Vacuum Gauge',tag:'VG',icon:'◉',cat:'Process Instrument',w:60,h:60,term:[['IN',-30,0,-1,0,'h']],init:{pressure:0,max:1,unit:'bar',service:'auto',fluid:'none'}},
  rotameter:{name:'Rotameter',tag:'RM',icon:'⇅',cat:'Process Instrument',w:70,h:80,term:[['IN',-35,20,-1,0,'h'],['OUT',35,20,1,0,'h']],init:{flow:0,max:100,unit:'L/min',total:0,service:'auto',fluid:'none'}},
  checkvalve:{name:'Check Valve',tag:'CV',icon:'↗️',cat:'Hydraulic',w:60,h:50,term:[['IN',-30,0,-1,0,'h'],['OUT',30,0,1,0,'h']],init:{open:false}},
  reliefvalve:{name:'Relief Valve',tag:'RV',icon:'⚠️',cat:'Hydraulic',w:70,h:60,term:[['IN',-35,0,-1,0,'h'],['OUT',35,0,1,0,'h']],init:{setting:5,open:false}},
  pressurecutoff:{name:'Pressure Cut-off Valve',tag:'PCV',icon:'⛔',cat:'Hydraulic',w:90,h:60,term:[['IN',-45,0,-1,0,'h'],['OUT',45,0,1,0,'h']],init:{setting:5,tripped:false,pressure:0,peakPressure:0}},
  timer:{name:'Digital Timer Relay',tag:'TMR',icon:'⏱️',cat:'Process Control',w:120,h:100,term:[['A1',-60,-20,-1,0],['A2',-60,20,-1,0],['COM',60,0,1,0],['NO',60,-25,1,0],['NC',60,25,1,0]],init:{mode:'on-delay',delay:5,elapsed:0,coilOn:false,output:false,remaining:0}} ,
  accumulator:{name:'Accumulator',tag:'ACC',icon:'🔋',cat:'Hydraulic',w:80,h:100,term:[['IN',-40,0,-1,0,'h']],init:{pressure:0,precharge:2,fluid:0.5}},
  filter:{name:'Strainer/Filter',tag:'F',icon:'⛵',cat:'Hydraulic',w:70,h:70,term:[['IN',-35,0,-1,0,'h'],['OUT',35,0,1,0,'h']],init:{clogged:false,pressureDrop:0}},
  manifold:{name:'Manifold',tag:'MF',icon:'🔀',cat:'Hydraulic',w:100,h:80,term:[['IN',-50,0,-1,0,'h'],['OUT1',50,-20,1,0,'h'],['OUT2',50,0,1,0,'h'],['OUT3',50,20,1,0,'h']],init:{o1:true,o2:true,o3:true}},
  solar:{name:'Solar Panel',tag:'PV',icon:'☀️',cat:'Electrical Power',w:150,h:110,term:[['+',-55,-35,-1,0],['-',-55,35,-1,0]],init:{watts:400,sunIntensity:80,efficiency:0.20,area:2.0,tilt:30,ambient:25,tempCoeff:-0.004,voltage:37,soiling:0,cloudiness:0.15,fault:'none',_cellTemp:25,_irradiance:800,status:'IDLE',current:0,outputPower:0}},
  battery:{name:'Battery Bank',tag:'BAT',icon:'🔋',cat:'Electrical Power',w:140,h:110,term:[['IN+',-60,-30,-1,0],['IN-',-60,30,-1,0],['OUT+',60,-30,1,0],['OUT-',60,30,1,0]],init:{capacity:100,soc:50,voltage:12,charging:false,discharging:false}},
  inverter:{name:'Inverter',tag:'INV',icon:'🔄',cat:'Electrical Power',w:140,h:100,term:[['DC+',-50,-30,-1,0],['DC-',-50,30,-1,0],['AC_L',50,-30,1,0],['AC_N',50,30,1,0],['IN_L',-20,50,0,1],['IN_N',20,50,0,1]],init:{on:true,rating:2000,efficiency:0.92,chargeMode:true,chargeCurrent:10,acPriority:true,lowCut:10,status:'STANDBY',loadW:0,mode:'OFF'}},
  hybrid:{name:'Hybrid Solar Inverter',tag:'HYB',icon:'☀️',cat:'Electrical Power',w:170,h:140,term:[['PV+',-65,-35,-1,0],['PV-',-65,-15,-1,0],['BAT+',-65,15,-1,0],['BAT-',-65,35,-1,0],['GRID_L',-40,-55,0,-1],['GRID_N',-15,-55,0,-1],['GRID_PE',10,-55,0,-1],['GEN_L',-40,55,0,1],['GEN_N',-15,55,0,1],['GEN_PE',10,55,0,1],['OUT_L',65,-20,1,0],['OUT_N',65,0,1,0],['OUT_PE',65,20,1,0]],init:{on:true,rating:5000,efficiency:0.95,priority:'SBU',chargeMode:true,chargeCurrent:40,maxPV:60,lowCut:10,switchSOC:20,genMode:'auto',genStart:30,status:'STANDBY',mode:'OFF',loadW:0,pvW:0,src:'NONE'}},
  lfpbattery:{name:'LiFePO4 Battery (LFP)',tag:'LFP',icon:'🔋',cat:'Electrical Power',w:150,h:120,term:[['IN+',-65,-35,-1,0],['IN-',-65,35,-1,0],['OUT+',65,-35,1,0],['OUT-',65,35,1,0]],init:{chemistry:'LiFePO4',series:16,parallel:1,cellAh:100,cellNom:3.2,cellChg:3.65,cellUv:2.5,cvSoc:95,chargeC:0.5,dischargeC:1,cellRi:2,soc:50,temperature:25,ambient:25,cycles:0,capacity:100,voltage:51.2,nomVoltage:51.2,charging:false,discharging:false}},
  bms:{name:'LFP Battery BMS',tag:'BMS',icon:'🛡️',cat:'Electrical Power',w:150,h:120,term:[['PACK+',-65,-30,-1,0],['PACK-',-65,30,-1,0],['P+',65,-30,1,0],['P-',65,30,1,0],['C+',-25,60,0,1],['C-',25,60,0,1],['CAN_H',-25,-60,0,-1],['CAN_L',25,-60,0,-1]],init:{on:true,chemistry:'LiFePO4',series:16,ovCell:3.75,uvCell:2.5,occA:50,ocdA:120,otC:60,utCharge:0,utDischarge:-20,balanceMv:30,balanceOn:true,chgOk:true,dsgOk:true,tripped:false,status:'OK',packV:0,current:0,cellDelta:8,temperature:25}},
  hybridlfp:{name:'LFP Hybrid Inverter',tag:'LHY',icon:'🔄',cat:'Electrical Power',w:180,h:150,term:[['PV+',-70,-40,-1,0],['PV-',-70,-20,-1,0],['BAT+',-70,15,-1,0],['BAT-',-70,40,-1,0],['GRID_L',-45,-60,0,-1],['GRID_N',-15,-60,0,-1],['GRID_PE',15,-60,0,-1],['GEN_L',-45,75,0,1],['GEN_N',-15,75,0,1],['GEN_PE',15,75,0,1],['OUT_L',70,-25,1,0],['OUT_N',70,0,1,0],['OUT_PE',70,25,1,0],['CAN_H',45,75,0,1],['CAN_L',70,75,0,1]],init:{on:true,battType:'LFP',battNom:48,rating:5000,efficiency:0.96,priority:'SBU',chargeMode:true,chargeCurrent:50,maxPV:80,bulkV:56.8,floatV:54.4,lowCut:10,switchSOC:20,genMode:'auto',genStart:20,bmsRequired:false,canOnline:false,status:'STANDBY',mode:'OFF',loadW:0,pvW:0,src:'NONE'}},
  hybridlfpgt:{name:'LFP Grid-Tie Hybrid',tag:'LGT',icon:'🔌',cat:'Electrical Power',w:170,h:140,term:[['PV+',-65,-35,-1,0],['PV-',-65,-15,-1,0],['BAT+',-65,15,-1,0],['BAT-',-65,35,-1,0],['GRID_L',-40,-55,0,-1],['GRID_N',-15,-55,0,-1],['GRID_PE',15,-55,0,-1],['OUT_L',65,-20,1,0],['OUT_N',65,0,1,0],['OUT_PE',65,20,1,0],['CAN_H',40,55,0,1],['CAN_L',65,55,0,1]],init:{on:true,battType:'LFP',battNom:48,rating:6000,efficiency:0.97,priority:'SBU',chargeMode:true,chargeCurrent:60,maxPV:100,bulkV:56.8,floatV:54.4,lowCut:10,switchSOC:15,exportEnable:true,exportLimit:4000,bmsRequired:false,canOnline:false,status:'STANDBY',mode:'OFF',loadW:0,pvW:0,src:'NONE'}},
  hybridbms:{name:'LFP Hybrid Inverter (BMS Integrated)',tag:'LHB',icon:'🔋',cat:'Electrical Power',w:190,h:160,term:[['PV+',-75,-45,-1,0],['PV-',-75,-25,-1,0],['BAT+',-75,10,-1,0],['BAT-',-75,35,-1,0],['GRID_L',-50,-65,0,-1],['GRID_N',-20,-65,0,-1],['GRID_PE',10,-65,0,-1],['GEN_L',-50,80,0,1],['GEN_N',-20,80,0,1],['GEN_PE',10,80,0,1],['OUT_L',75,-25,1,0],['OUT_N',75,0,1,0],['OUT_PE',75,25,1,0]],init:{on:true,battType:'LFP',battNom:48,rating:5000,efficiency:0.96,priority:'SBU',chargeMode:true,chargeCurrent:50,maxPV:80,bulkV:56.8,floatV:54.4,lowCut:10,switchSOC:20,genMode:'auto',genStart:20,bmsRequired:false,canOnline:true,status:'STANDBY',mode:'OFF',loadW:0,pvW:0,src:'NONE',series:16,ovCell:3.75,uvCell:2.5,occA:50,ocdA:120,otC:60,bmsStatus:'OK',chgOk:true,dsgOk:true}},

  acvawmeter:{name:'AC V/A/W Meter',tag:'ACW',icon:'📟',cat:'Electrical Instrument',w:100,h:90,term:[['L_in',-50,-20,-1,0],['N_in',-50,20,-1,0],['L_out',50,-20,1,0],['N_out',50,20,1,0]],init:{voltage:0,current:0,watts:0,pf:1,kwh:0,freq:50}},
  dcvawmeter:{name:'DC V/A/W Meter',tag:'DCW',icon:'📟',cat:'Electrical Instrument',w:100,h:90,term:[['+_in',-50,-20,-1,0],['-_in',-50,20,-1,0],['+_out',50,-20,1,0],['-_out',50,20,1,0]],init:{voltage:0,current:0,watts:0,kwh:0}},
  chargecontroller:{name:'Charge Controller',tag:'CC',icon:'⚡',cat:'Electrical Power',w:120,h:80,term:[['PV+',-50,-25,-1,0],['PV-',-50,25,-1,0],['BAT+',50,-25,1,0],['BAT-',50,25,1,0]],init:{on:true,mode:'mppt',bulkVoltage:14.4,floatVoltage:13.6}},
  dcsource:{name:'DC Power Supply',tag:'DC',icon:'🔋',cat:'Electrical Power',w:100,h:80,term:[['+',-40,-20,-1,0],['-',-40,20,-1,0]],init:{on:true,volts:24,current:10}},
  batterycharger:{name:'AC–DC Battery Charger',tag:'BC',icon:'🔌',cat:'Electrical Power',w:130,h:100,term:[['AC_L',-55,-25,-1,0],['AC_N',-55,25,-1,0],['DC+',55,-25,1,0],['DC-',55,25,1,0]],init:{on:false,acVoltage:230,frequency:50,dcVoltage:14.4,currentLimit:10,efficiency:0.9,ripple:1.5,outputCurrent:0,inputCurrent:0,temperature:25,status:'OFFLINE'}},
  generator:{name:'Generator',tag:'GEN',icon:'⚙️',cat:'Electrical Power',w:140,h:100,term:[['L',-60,-25,-1,0],['N',-60,25,-1,0],['PE',0,50,0,1]],init:{on:false,kva:5,fuel:100,fuelRate:0.5}},
  transformer:{name:'Transformer',tag:'T',icon:'🔄',cat:'Electrical Power',w:120,h:100,term:[['PRI_L',-50,-30,-1,0],['PRI_N',-50,30,-1,0],['SEC_L',50,-30,1,0],['SEC_N',50,30,1,0]],init:{ratio:1,priVolts:230,secVolts:230,kva:10}},
  wind:{name:'Wind Turbine',tag:'WT',icon:'💨',cat:'Electrical Power',w:130,h:170,term:[['+',-55,-35,-1,0],['-',-55,35,-1,0]],init:{power:2000,windSpeed:9,cutIn:3.5,cutOut:25,ratedSpeed:12,rotorDiameter:4.5,efficiency:0.38,airDensity:1.225,turbulence:0.18,voltage:24,fault:'none',ang:0,rpm:0,yaw:0,_instWind:9,_gust:0,status:'IDLE'}},
  capacitorbank:{name:'Capacitor Bank',tag:'CB',icon:'⚡',cat:'Electrical Power',w:100,h:80,term:[['A',-40,-20,-1,0],['B',-40,20,-1,0]],init:{kvar:25,voltage:400,connected:false}},
  supercap:{name:'Supercapacitor',tag:'SC',icon:'🔋',cat:'Electrical Power',w:80,h:100,term:[['+',-30,-40,-1,0],['-',-30,40,-1,0]],init:{farads:100,voltage:2.7,soc:50}},
  fuse:{name:'Fuse',tag:'F',icon:'🔒',cat:'Electrical Protection',w:60,h:40,term:[['a',-30,0,-1,0],['b',30,0,1,0]],init:{rating:10,blown:false}},
  spd:{name:'SPD',tag:'SPD',icon:'⚡',cat:'Electrical Protection',w:80,h:60,term:[['L',-35,-15,-1,0],['N',-35,15,-1,0],['PE',35,0,1,0]],init:{type:'type2',status:'ok'}},
  earthrod:{name:'Earth Rod',tag:'ER',icon:'🌍',cat:'Electrical Protection',w:60,h:100,term:[['PE',0,40,0,1]],init:{resistance:10}},
  lightning:{name:'Lightning Arrester',tag:'LA',icon:'⚡',cat:'Electrical Protection',w:60,h:80,term:[['L',-25,-20,-1,0],['PE',-25,20,-1,0]],init:{status:'ok'}},
  relay:{name:'Relay',tag:'K',icon:'🔌',cat:'Process Control',w:100,h:80,term:[['A1',-45,-25,-1,0],['A2',-45,25,-1,0],['NO',45,-25,1,0],['NC',45,25,1,0],['COM',0,35,0,1]],init:{coilOn:false,contact:'NO'}},
  ssr:{name:'SSR',tag:'SSR',icon:'💡',cat:'Process Control',w:80,h:60,term:[['+',-35,-15,-1,0],['-',-35,15,-1,0],['A1',35,-15,1,0],['A2',35,15,1,0]],init:{on:false,rating:40}},
  selector:{name:'Selector Switch',tag:'SS',icon:'🔘',cat:'Process Control',w:100,h:80,term:[['COM',-45,0,-1,0],['POS1',45,-25,1,0],['POS2',45,0,1,0],['POS3',45,25,1,0]],init:{position:1}},
  transfer:{name:'Transfer Switch',tag:'TS',icon:'🔄',cat:'Process Control',w:120,h:80,term:[['COM',-55,0,-1,0],['NORM',55,-25,1,0],['EMER',55,25,1,0]],init:{position:'norm'}},
  ats:{name:'Automatic Transfer Switch (ATS)',tag:'ATS',icon:'🔀',cat:'Electrical Power',w:190,h:150,term:[['SRC1_L',-95,-50,-1,0],['SRC1_N',-95,-30,-1,0],['SRC2_L',-95,-10,-1,0],['SRC2_N',-95,10,-1,0],['SRC3_L',-95,30,-1,0],['SRC3_N',-95,50,-1,0],['SRC4_L',-95,70,-1,0],['SRC4_N',-95,90,-1,0],['LOAD_L',95,-20,1,0],['LOAD_N',95,20,1,0]],init:{mode:'auto',priority:1,manualInput:1,transferDelay:1.5,deadTime:0.35,_active:0,_pending:0,_timer:0,_dead:0,_healthy:[false,false,false,false],transfers:0}} ,
  disconnect:{name:'Disconnect Switch',tag:'DS',icon:'🔌',cat:'Process Control',w:80,h:60,term:[['L',-35,-15,-1,0],['N',-35,15,-1,0],['L_out',35,-15,1,0],['N_out',35,15,1,0]],init:{closed:true}},
  plc:{name:'PLC',tag:'PLC',icon:'🖥️',cat:'Process Control',w:140,h:100,term:[['L',-60,-30,-1,0],['N',-60,30,-1,0],['I1',60,-40,1,0],['I2',60,-20,1,0],['O1',60,20,1,0],['O2',60,40,1,0]],init:{program:'auto',scanTime:10,input1:false,input2:false,output1:false,output2:false}},
  vfd:{name:'VFD',tag:'VFD',icon:'📊',cat:'Process Control',w:140,h:120,term:[['L1',-60,-40,-1,0],['L2',-60,-20,-1,0],['L3',-60,0,-1,0],['PE',-60,40,-1,0],['U',60,-30,1,0],['V',60,0,1,0],['W',60,30,1,0]],init:{on:false,hz:50,rpm:1440,torque:100,amps:10}},
  softstart:{name:'Soft Starter',tag:'SS',icon:'📈',cat:'Process Control',w:120,h:100,term:[['L1',-50,-30,-1,0],['L2',-50,0,-1,0],['L3',-50,30,-1,0],['T1',50,-30,1,0],['T2',50,0,1,0],['T3',50,30,1,0]],init:{on:false,rampTime:10,currentLimit:150}},
  pid:{name:'PID Controller',tag:'PID',icon:'📊',cat:'Process Control',w:120,h:100,term:[['PV',-50,-30,-1,0],['SP',-50,30,-1,0],['OUT',50,0,1,0]],init:{kp:10,ki:1,kd:0.5,setpoint:50,pv:0,output:0,mode:'auto'}},
  ct:{name:'Current Transformer',tag:'CT',icon:'⭕',cat:'Hydraulic Instrument',w:60,h:60,term:[['P1',-25,-15,-1,0],['P2',-25,15,-1,0],['S1',25,-15,1,0],['S2',25,15,1,0]],init:{ratio:100/5,primary:0,secondary:0}},
  vt:{name:'Voltage Transformer',tag:'VT',icon:'⭕',cat:'Hydraulic Instrument',w:60,h:60,term:[['P1',-25,-15,-1,0],['P2',-25,15,-1,0],['S1',25,-15,1,0],['S2',25,15,1,0]],init:{ratio:400/100,primary:0,secondary:0}},
  energymeter:{name:'Energy Meter',tag:'EM',icon:'📊',cat:'Hydraulic Instrument',w:80,h:100,term:[['L',-35,-20,-1,0],['N',-35,20,-1,0]],init:{kwh:0,kw:0,voltage:230,current:0,pf:1}},
  pfccap:{name:'PFC Capacitor',tag:'PFC',icon:'⚡',cat:'Hydraulic Instrument',w:60,h:60,term:[['A',-25,0,-1,0],['B',25,0,1,0]],init:{kvar:10,voltage:400,connected:false}},
  heater:{name:'Heater',tag:'H',icon:'🔥',cat:'Electrical Loads',w:80,h:80,term:[['L',-35,-20,-1,0],['N',-35,20,-1,0]],init:{watts:2000,temperature:20,powered:false}},
  fan:{name:'Fan',tag:'F',icon:'💨',cat:'Electrical Loads',w:80,h:80,term:[['L',-35,-20,-1,0],['N',-35,20,-1,0]],init:{watts:100,speed:0,powered:false}},
  ledstrip:{name:'LED Strip',tag:'LED',icon:'💡',cat:'Electrical Loads',w:100,h:40,term:[['+',-45,0,-1,0],['-',45,0,1,0]],init:{watts:50,leds:30,brightness:0,powered:false}},
  solenoid:{name:'Solenoid Valve',tag:'SV',icon:'🔧',cat:'Electrical Loads',w:80,h:60,term:[['+',-35,-15,-1,0],['-',-35,15,-1,0]],init:{watts:20,open:false,powered:false}},
  // === POWER GENERATION ===
  gasturbine:{name:'Gas Turbine',tag:'GT',icon:'🔥',cat:'Power Generation',w:160,h:120,term:[['GAS_IN',-70,-40,-1,0,'h'],['AIR_IN',-70,-20,-1,0,'h'],['EXHAUST',70,-40,1,0,'h'],['L',70,-10,1,0],['N',70,10,1,0],['PE',70,30,0,1]],init:{on:false,mw:50,fuel:100,efficiency:0.35,rpm:3000,temperature:20}},
  steamturbine:{name:'Steam Turbine',tag:'ST',icon:'💨',cat:'Power Generation',w:160,h:120,term:[['STEAM_IN',-70,-40,-1,0,'h'],['CONDENSATE_OUT',-70,-20,-1,0,'h'],['EXHAUST',70,-40,1,0,'h'],['L',70,-10,1,0],['N',70,10,1,0],['PE',70,30,0,1]],init:{on:false,mw:100,pressure:100,temperature:500,rpm:3000}},
  boiler:{name:'Boiler',tag:'BLR',icon:'🔥',cat:'Power Generation',w:140,h:100,term:[['FUEL',-50,-30,-1,0,'h'],['WATER',-50,30,-1,0,'h'],['STEAM',50,0,1,0,'h']],init:{on:false,pressure:100,temperature:200,fuelRate:5,waterLevel:80}},
  condenser:{name:'Condenser',tag:'CD',icon:'❄️',cat:'Power Generation',w:120,h:80,term:[['STEAM_IN',-50,0,-1,0,'h'],['WATER_IN',-50,20,-1,0,'h'],['CONDENSATE',50,0,1,0,'h']],init:{cooling:100,pressure:50,temperature:30}},
  coolingtower:{name:'Cooling Tower',tag:'CT',icon:'🏗️',cat:'Power Generation',w:140,h:140,term:[['HOT_IN',-50,-30,-1,0,'h'],['COLD_OUT',50,-30,1,0,'h']],init:{capacity:100,fanSpeed:0}},
  // === GAS SYSTEM ===
  gascompressor:{name:'Gas Compressor',tag:'GC',icon:'⚙️',cat:'Gas System',w:140,h:100,term:[['IN',-60,-25,-1,0,'h'],['OUT',60,-25,1,0,'h'],['M',-60,15,-1,0],['N',-60,35,-1,0]],init:{on:false,pressure:20,flow:100,efficiency:0.85}},
  gasboosterpump:{name:'Gas Booster Pump',tag:'GBP',icon:'⚙️',cat:'Gas System',w:140,h:100,term:[['IN',-60,-25,-1,0,'h'],['OUT',60,-25,1,0,'h'],['M',-60,15,-1,0],['N',-60,35,-1,0]],init:{on:false,pressure:30,flow:60,efficiency:0.82}},
  airsupply:{name:'Air Supply Source',tag:'AIR',icon:'💨',cat:'Gas System',w:150,h:120,term:[['L',-75,-34,-1,0],['N',-75,0,-1,0],['PE',-75,34,-1,0],['OUT',75,0,1,0,'h']],init:{on:true,unlimited:false,pressure:1.2,flow:2000,temperature:25,humidity:45,powerKw:5.5,pf:0.85,inrush:6,fault:'none',elec:true,powered:false,cutout:false}},
  fluestack:{name:'Flue Stack',tag:'STK',icon:'🏭',cat:'Gas System',w:60,h:120,term:[['FLUE_IN',0,55,0,1,'h']],init:{draft:0.02}},
  gasvalve:{name:'Gas Valve',tag:'GV',icon:'🔧',cat:'Gas System',w:80,h:60,term:[['IN',-35,-15,-1,0,'h'],['OUT',35,-15,1,0,'h']],init:{open:false,opening:100,position:0}},
  gasfilter:{name:'Gas Filter',tag:'GF',icon:'⛵',cat:'Gas System',w:80,h:80,term:[['IN',-35,-20,-1,0,'h'],['OUT',35,-20,1,0,'h']],init:{clogged:false,pressureDrop:0}},
  gasmeter:{name:'Gas Meter',tag:'GM',icon:'📊',cat:'Gas System',w:80,h:80,term:[['IN',-35,-20,-1,0,'h'],['OUT',35,-20,1,0,'h']],init:{flow:0,total:0,pressure:20}},
  pressureregulator:{name:'Pressure Regulator',tag:'PR',icon:'🎛️',cat:'Gas System',w:100,h:80,term:[['IN',-40,-20,-1,0,'h'],['OUT',40,-20,1,0,'h']],init:{setpoint:20,output:20}},
  gastank:{name:'Gas Storage Tank',tag:'GST',icon:'🛢️',cat:'Gas System',w:140,h:140,term:[['IN',-60,0,-1,0,'h'],['OUT',60,0,1,0,'h']],init:{level:80,pressure:20,capacity:1000}},
  gaswell:{name:'Gas Well',tag:'GW',icon:'🛢️',cat:'Gas System',w:120,h:120,term:[['OUT',50,0,1,0,'h']],init:{on:false,pressure:50,flow:1000,temperature:40}},
  naturalgas:{name:'Natural Gas Source',tag:'NG',icon:'🔥',cat:'Gas System',w:100,h:80,term:[['OUT',40,0,1,0,'h']],init:{on:true,pressure:20,flow:500,methane:0.9}},
  lpgtank:{name:'LPG Tank',tag:'LPG',icon:'🛢️',cat:'Gas System',w:120,h:100,term:[['OUT',50,0,1,0,'h']],init:{level:80,pressure:8,temperature:20}},
  burner:{name:'Gas Burner',tag:'GB',icon:'🔥',cat:'Gas System',w:100,h:80,term:[['GAS_IN',-40,-20,-1,0,'h'],['AIR_IN',-40,20,-1,0,'h'],['FLAME_OUT',40,0,1,0,'h']],init:{on:false,flameTemp:1200,efficiency:0.95}},
  combustionchamber:{name:'Combustion Chamber',tag:'CC',icon:'🔥',cat:'Gas System',w:140,h:100,term:[['FUEL_IN',-60,-30,-1,0,'h'],['AIR_IN',-60,30,-1,0,'h'],['FLAME_OUT',60,0,1,0,'h']],init:{on:false,temperature:1500,pressure:20}},
  flame:{name:'Flame',tag:'FL',icon:'🔥',cat:'Gas System',w:80,h:80,term:[['FUEL_IN',-30,0,-1,0,'h']],init:{on:false,temperature:1200}},
  furnace:{name:'Furnace',tag:'FNC',icon:'🔥',cat:'Gas System',w:140,h:120,term:[['FUEL_IN',-60,-30,-1,0,'h'],['AIR_IN',-60,30,-1,0,'h'],['HEAT_OUT',60,0,1,0,'h']],init:{on:false,temperature:800,efficiency:0.9}},
  // === STEAM SYSTEM ===
  steamsource:{name:'Steam Source',tag:'SS',icon:'💨',cat:'Steam System',w:120,h:100,term:[['STEAM_OUT',50,0,1,0,'h'],['WATER_IN',-50,30,-1,0,'h']],init:{on:true,pressure:100,temperature:500,flow:50}},
  steamgenerator:{name:'Steam Generator',tag:'SG',icon:'🔥',cat:'Steam System',w:140,h:120,term:[['FUEL_IN',-60,-40,-1,0,'h'],['WATER_IN',-60,0,-1,0,'h'],['STEAM_OUT',60,-40,1,0,'h']],init:{on:false,pressure:100,temperature:500,efficiency:0.85}},
  steampipe:{name:'Steam Pipe',tag:'SP',icon:'▬',cat:'Steam System',w:100,h:20,term:[['IN',-45,0,-1,0,'h'],['OUT',45,0,1,0,'h']],init:{diameter:150,pressure:100,temperature:500}},
  steamtrap:{name:'Steam Trap',tag:'ST',icon:'💧',cat:'Steam System',w:60,h:60,term:[['IN',-25,-15,-1,0,'h'],['OUT',25,-15,1,0,'h'],['COND',25,15,1,0,'h']],init:{open:false,condensate:0}},
  steamseparator:{name:'Steam Separator',tag:'SS',icon:'🌀',cat:'Steam System',w:100,h:100,term:[['IN',-40,-30,-1,0,'h'],['STEAM',40,-30,1,0,'h'],['WATER',40,30,1,0,'h']],init:{efficiency:0.95}},
  feedwaterpump:{name:'Feedwater Pump',tag:'FWP',icon:'⚙️',cat:'Steam System',w:120,h:80,term:[['IN',-50,-20,-1,0,'h'],['OUT',50,-20,1,0,'h'],['M',-50,20,-1,0],['N',-50,40,-1,0]],init:{on:false,flow:100,pressure:200}},
  steamboosterpump:{name:'Steam Booster Pump',tag:'SBP',icon:'⚙️',cat:'Steam System',w:120,h:80,term:[['IN',-50,-20,-1,0,'h'],['OUT',50,-20,1,0,'h'],['M',-50,20,-1,0],['N',-50,40,-1,0]],init:{on:false,flow:5000,pressure:40}},
  economizer:{name:'Economizer',tag:'ECO',icon:'🔥',cat:'Steam System',w:140,h:80,term:[['FLUE_IN',-60,-25,-1,0,'h'],['FLUE_OUT',60,-25,1,0,'h'],['WATER_IN',-60,25,-1,0,'h'],['WATER_OUT',60,25,1,0,'h']],init:{efficiency:0.85}},
  superheater:{name:'Superheater',tag:'SH',icon:'🔥',cat:'Steam System',w:140,h:80,term:[['STEAM_IN',-60,-25,-1,0,'h'],['STEAM_OUT',60,-25,1,0,'h'],['FLUE_IN',-60,25,-1,0,'h'],['FLUE_OUT',60,25,1,0,'h']],init:{temperature:540,efficiency:0.90}},
  reheater:{name:'Reheater',tag:'RH',icon:'🔥',cat:'Steam System',w:140,h:80,term:[['STEAM_IN',-60,-25,-1,0,'h'],['STEAM_OUT',60,-25,1,0,'h'],['FLUE_IN',-60,25,-1,0,'h'],['FLUE_OUT',60,25,1,0,'h']],init:{temperature:540,efficiency:0.88}},
  deaerator:{name:'Deaerator',tag:'DA',icon:'💨',cat:'Steam System',w:120,h:100,term:[['STEAM_IN',-50,-30,-1,0,'h'],['WATER_IN',-50,30,-1,0,'h'],['WATER_OUT',50,0,1,0,'h']],init:{efficiency:0.98,temperature:150}},
  lpsystem:{name:'LP System',tag:'LP',icon:'💧',cat:'Steam System',w:100,h:80,term:[['IN',-40,-20,-1,0,'h'],['OUT',40,-20,1,0,'h']],init:{pressure:5,temperature:150}},
  hpsystem:{name:'HP System',tag:'HP',icon:'💨',cat:'Steam System',w:100,h:80,term:[['IN',-40,-20,-1,0,'h'],['OUT',40,-20,1,0,'h']],init:{pressure:160,temperature:540}},
  feedwatertank:{name:'Feedwater Tank',tag:'FWT',icon:'🛢️',cat:'Steam System',w:120,h:100,term:[['IN',-50,-25,-1,0,'h'],['OUT',50,-25,1,0,'h'],['RETURN',-50,25,-1,0,'h']],init:{level:70,temperature:120}},
  blowdown:{name:'Blowdown Valve',tag:'BD',icon:'🔧',cat:'Steam System',w:80,h:60,term:[['IN',-35,-15,-1,0,'h'],['OUT',35,-15,1,0,'h']],init:{open:false,rate:5}},
  // === ELECTRICAL CONTROL ===
  governor:{name:'Governor',tag:'GOV',icon:'🎛️',cat:'Electrical Control',w:100,h:80,term:[['SPEED',-40,-20,-1,0],['ACTUATOR',-40,20,-1,0],['VALVE',40,0,1,0]],init:{setpoint:3000,deadband:10,output:50}},
  exciter:{name:'Exciter',tag:'EX',icon:'⚡',cat:'Electrical Control',w:80,h:60,term:[['FIELD',-35,-15,-1,0],['ARMATURE',-35,15,-1,0],['OUTPUT',35,0,1,0]],init:{voltage:200,current:50}},
  syncrelay:{name:'Sync Relay',tag:'SR',icon:'🔄',cat:'Electrical Control',w:100,h:80,term:[['V_L',-40,-25,-1,0],['V_N',-40,25,-1,0],['G_L',40,-25,1,0],['G_N',40,25,1,0]],init:{synced:false,voltageMatch:false,freqMatch:false}},
  avr:{name:'AVR',tag:'AVR',icon:'📊',cat:'Electrical Control',w:100,h:80,term:[['SPEED',-40,-20,-1,0],['VOLTAGE',-40,20,-1,0],['FIELD',40,0,1,0]],init:{setpoint:230,excitation:50,mode:'auto'}},
  // === ELECTRICAL PROTECTION ===
  busbar:{name:'Busbar',tag:'BB',icon:'▬',cat:'Electrical Wiring',w:200,h:30,term:[['L1',-90,0,-1,0],['L2',-30,0,-1,0],['L3',30,0,-1,0],['N',90,0,1,0]],init:{voltage:11000,current:0}},
  hvbreaker:{name:'HV Breaker',tag:'HVB',icon:'🔌',cat:'Electrical Protection',w:100,h:80,term:[['L',-40,-25,-1,0],['N',-40,25,-1,0],['L_out',40,-25,1,0],['N_out',40,25,1,0]],init:{kv:11,rating:2000,closed:false,tripped:false}},
  transformerhv:{name:'HV Transformer',tag:'HVT',icon:'🔄',cat:'Electrical Protection',w:140,h:100,term:[['PRI_L',-60,-30,-1,0],['PRI_N',-60,30,-1,0],['SEC_L',60,-30,1,0],['SEC_N',60,30,1,0]],init:{priKv:11,secKv:0.4,mva:50,ratio:27.5}},
  reactor:{name:'Reactor',tag:'RE',icon:'⚛️',cat:'Electrical Protection',w:120,h:120,term:[['L',-50,-30,-1,0],['N',-50,30,-1,0]],init:{mvar:50,x:0.2,ratedV:11}},
  differentialrelay:{name:'Diff Relay',tag:'DR',icon:'🔌',cat:'Electrical Protection',w:100,h:80,term:[['CT1_IN',-40,-25,-1,0],['CT2_IN',-40,25,-1,0],['CT1_OUT',40,-25,1,0],['CT2_OUT',40,25,1,0],['TRIP',0,40,0,1]],init:{tripped:false,setting:0.2,measuredDiff:0}},
  overcurrentrelay:{name:'OC Relay',tag:'OCR',icon:'🔌',cat:'Electrical Protection',w:100,h:80,term:[['CT_IN',-40,-20,-1,0],['TRIP',40,0,1,0]],init:{tripped:false,setting:1.5,timeDelay:0.5}},
  distanceprotection:{name:'Distance Protection',tag:'DP',icon:'🔌',cat:'Electrical Protection',w:120,h:100,term:[['V',-50,-30,-1,0],['I',-50,30,-1,0],['TRIP',50,0,1,0]],init:{zone1:0.8,zone2:1.2,zone3:2.0}},
  synchroscope:{name:'Synchroscope',tag:'SYN',icon:'🔄',cat:'Electrical Instrument',w:100,h:100,term:[['V_G',-40,-30,-1,0],['V_S',-40,30,-1,0],['F_G',40,-30,1,0],['F_S',40,30,1,0]],init:{angle:0,freqDiff:0,voltDiff:0}},
  generatorprotection:{name:'Gen Protection',tag:'GP',icon:'🛡️',cat:'Electrical Protection',w:140,h:120,term:[['CT1',-60,-40,-1,0],['CT2',-60,-20,-1,0],['CT3',-60,0,-1,0],['VT1',-60,20,-1,0],['VT2',-60,40,-1,0],['TRIP',60,0,1,0]],init:{functions:['overcurrent','differential','reversePower','overexcitation','underfrequency','overfrequency','lossOfField','negativeSequence']}},

  // === PLUMBING & FITTINGS ===
  gatevalve:{name:'Gate Valve',tag:'GV',icon:'🔧',cat:'Plumbing',w:80,h:60,term:[['IN',-35,-15,-1,0,'h'],['OUT',35,-15,1,0,'h']],init:{open:false,opening:100,wheel:0}},
  globevalve:{name:'Globe Valve',tag:'GLV',icon:'🔧',cat:'Plumbing',w:80,h:60,term:[['IN',-35,-15,-1,0,'h'],['OUT',35,-15,1,0,'h']],init:{open:false,opening:100,position:0}},
  ballvalve:{name:'Ball Valve',tag:'BV',icon:'🔧',cat:'Plumbing',w:80,h:60,term:[['IN',-35,-15,-1,0,'h'],['OUT',35,-15,1,0,'h']],init:{open:false,opening:100,angle:0}},
  butterflyvalve:{name:'Butterfly Valve',tag:'BFV',icon:'🔧',cat:'Plumbing',w:80,h:60,term:[['IN',-35,-15,-1,0,'h'],['OUT',35,-15,1,0,'h']],init:{open:false,opening:100,disc:0}},
  expansionjoint:{name:'Expansion Joint',tag:'EJ',icon:'🔄',cat:'Plumbing',w:100,h:40,term:[['IN',-40,0,-1,0,'h'],['OUT',40,0,1,0,'h']],init:{expansion:0}},
  flange:{name:'Flange',tag:'FL',icon:'⭕',cat:'Plumbing',w:60,h:60,term:[['IN',-25,0,-1,0,'h'],['OUT',25,0,1,0,'h']],init:{size:150,rating:300}},
  gasket:{name:'Gasket',tag:'GK',icon:'⭕',cat:'Plumbing',w:60,h:60,term:[['IN',-25,0,-1,0,'h'],['OUT',25,0,1,0,'h']],init:{material:'PTFE',thickness:3}},
  pipesupport:{name:'Pipe Support',tag:'PS',icon:'🔧',cat:'Plumbing',w:60,h:80,term:[['PIPE',0,-30,0,-1,'h']],init:{type:'fixed',load:0}},
  reducer:{name:'Reducer',tag:'RD',icon:'▶',cat:'Plumbing',w:80,h:40,term:[['IN',-35,0,-1,0,'h'],['OUT',35,0,1,0,'h']],init:{sizeIn:200,sizeOut:150}},
  teejoint:{name:'Tee Joint',tag:'TJ',icon:'┳',cat:'Plumbing',w:60,h:60,term:[['IN',-25,0,-1,0,'h'],['OUT1',25,-20,1,0,'h'],['OUT2',25,20,1,0,'h']],init:{size:150}},
  elbow90:{name:'90° Elbow',tag:'EL',icon:'┐',cat:'Plumbing',w:60,h:60,term:[['IN',-25,0,-1,0,'h'],['OUT',0,25,0,1,'h']],init:{size:150}},
  elbow45:{name:'45° Elbow',tag:'EL45',icon:'◜',cat:'Plumbing',w:60,h:60,term:[['IN',-25,0,-1,0,'h'],['OUT',20,20,0,1,'h']],init:{size:150}},

  // ── Industrial process sensors: water, steam, gas and combustion ──
  watersensor:{name:'Water Pressure Transmitter',tag:'PT-W',icon:'◉',cat:'Process Instrument',w:76,h:64,term:[['IN',-38,0,-1,0,'h']],init:{service:'water',unit:'bar',range:0,span:16,manualValue:3.2,measured:0,auto:true,offset:0,accuracy:0.5,fault:'none'}},
  waterflowsensor:{name:'Water Flow Transmitter',tag:'FT-W',icon:'⇢',cat:'Process Instrument',w:76,h:64,term:[['IN',-38,0,-1,0,'h']],init:{service:'water',unit:'L/min',range:0,span:500,manualValue:120,measured:0,auto:true,offset:0,accuracy:0.5,fault:'none'}},
  waterlevelsensor:{name:'Water Level Transmitter',tag:'LT-W',icon:'▥',cat:'Process Instrument',w:76,h:64,term:[['IN',-38,0,-1,0,'h']],init:{service:'water',unit:'%',range:0,span:100,manualValue:50,measured:0,auto:true,offset:0,accuracy:0.5,fault:'none'}},
  watertempsensor:{name:'Water Temperature Transmitter',tag:'TT-W',icon:'🌡',cat:'Process Instrument',w:76,h:64,term:[['IN',-38,0,-1,0,'h']],init:{service:'water',unit:'°C',range:0,span:150,manualValue:25,measured:0,auto:true,offset:0,accuracy:0.5,fault:'none'}},
  steampressure:{name:'Steam Pressure Transmitter',tag:'PT-S',icon:'◉',cat:'Process Instrument',w:76,h:64,term:[['IN',-38,0,-1,0,'h']],init:{service:'steam',unit:'bar',range:0,span:250,manualValue:100,measured:0,auto:true,offset:0,accuracy:0.5,fault:'none'}},
  steamtemp:{name:'Steam Temperature Transmitter',tag:'TT-S',icon:'🌡',cat:'Process Instrument',w:76,h:64,term:[['IN',-38,0,-1,0,'h']],init:{service:'steam',unit:'°C',range:0,span:600,manualValue:485,measured:0,auto:true,offset:0,accuracy:0.5,fault:'none'}},
  steamflow:{name:'Steam Flow Transmitter',tag:'FT-S',icon:'⇢',cat:'Process Instrument',w:76,h:64,term:[['IN',-38,0,-1,0,'h']],init:{service:'steam',unit:'kg/h',range:0,span:50000,manualValue:12000,measured:0,auto:true,offset:0,accuracy:0.5,fault:'none'}},
  steamquality:{name:'Steam Quality Sensor',tag:'QT-S',icon:'◈',cat:'Process Instrument',w:76,h:64,term:[['IN',-38,0,-1,0,'h']],init:{service:'steam',unit:'%',range:0,span:100,manualValue:98,measured:0,auto:true,offset:0,accuracy:1,fault:'none'}},
  gaspressure:{name:'Gas Pressure Transmitter',tag:'PT-G',icon:'◉',cat:'Process Instrument',w:76,h:64,term:[['IN',-38,0,-1,0,'h']],init:{service:'gas',unit:'bar',range:0,span:100,manualValue:20,measured:0,auto:true,offset:0,accuracy:0.5,fault:'none'}},
  gasflow:{name:'Gas Flow Transmitter',tag:'FT-G',icon:'⇢',cat:'Process Instrument',w:76,h:64,term:[['IN',-38,0,-1,0,'h']],init:{service:'gas',unit:'Nm³/h',range:0,span:10000,manualValue:500,measured:0,auto:true,offset:0,accuracy:0.5,fault:'none'}},
  gaslevel:{name:'Gas Tank Level Transmitter',tag:'LT-G',icon:'▥',cat:'Process Instrument',w:76,h:64,term:[['IN',-38,0,-1,0,'h']],init:{service:'gas',unit:'%',range:0,span:100,manualValue:80,measured:0,auto:true,offset:0,accuracy:0.5,fault:'none'}},
  gasdetector:{name:'Combustible Gas Detector',tag:'GD',icon:'⚠',cat:'Process Instrument',w:76,h:64,term:[['IN',-38,0,-1,0,'h']],init:{service:'gas',unit:'%LEL',range:0,span:100,manualValue:0,measured:0,auto:true,offset:0,accuracy:1,alarm:20,trip:40,fault:'none'}},
  oxygenanalyzer:{name:'O₂ Gas Analyzer',tag:'AT-O2',icon:'O₂',cat:'Process Instrument',w:76,h:64,term:[['IN',-38,0,-1,0,'h']],init:{service:'gas',unit:'% vol',range:0,span:25,manualValue:20.9,measured:0,auto:true,offset:0,accuracy:0.1,fault:'none'}},
  phsensor:{name:'pH Sensor',tag:'AIT-pH',icon:'pH',cat:'Process Instrument',w:76,h:64,term:[['IN',-38,0,-1,0,'h']],init:{service:'water',unit:'pH',range:0,span:14,manualValue:7,measured:0,auto:true,offset:0,accuracy:0.1,fault:'none'}},
  conductivity:{name:'Conductivity Sensor',tag:'AIT-EC',icon:'EC',cat:'Process Instrument',w:76,h:64,term:[['IN',-38,0,-1,0,'h']],init:{service:'water',unit:'µS/cm',range:0,span:5000,manualValue:500,measured:0,auto:true,offset:0,accuracy:1,fault:'none'}},
  humiditysensor:{name:'Gas Humidity Transmitter',tag:'MT-G',icon:'%RH',cat:'Process Instrument',w:76,h:64,term:[['IN',-38,0,-1,0,'h']],init:{service:'gas',unit:'%RH',range:0,span:100,manualValue:45,measured:0,auto:true,offset:0,accuracy:1,fault:'none'}},
};
const INSTRUMENT_TYPES=new Set(['gauge','tempgauge','levelgauge','dpgauge','vacuumgauge','rotameter','flowmeter','watersensor','waterflowsensor','waterlevelsensor','watertempsensor','steampressure','steamtemp','steamflow','steamquality','gaspressure','gasflow','gaslevel','gasdetector','oxygenanalyzer','phsensor','conductivity','humiditysensor']);
const COMP_BLURB={
  source:'Mains or standby AC supply. Connect L and N through a breaker; take PE straight to machine earth bars.',
  mcb:'Two-pole miniature breaker. Line and neutral pass only while closed and not tripped. Size the rating above load current.',
  acbreaker:'Two-pole AC breaker for L and N together. Use on AC feeders; reset after the fault is cleared.',
  dcbreaker:'Two-pole DC breaker for + and −. Use on battery, PV and DC-motor feeders.',
  rcd:'Earth-leakage device. Wire load L/N through it so a simulated earth fault trips the 30 mA path.',
  overload:'Thermal overload in series with the motor. Set near full-load amps; reset after cooling.',
  float:'Tank level switch. COM–NC is closed while the tank is low (pump start); COM–NO closes at the stop level.',
  contactor:'Power relay. Energise A1–A2 to close L1–T1 and L2–T2. Typical coil circuit is float NC to A1, N to A2.',
  switch:'Maintained isolator. Close it in series with a coil or lamp.',
  pb:'Momentary push-button. Hold to close (NO) or open (NC) the a–b path.',
  motor:'Universal pump. Electrical L/N/PE plus SUC (in) and DIS (out). Draw from a Water Source, Water Tank or Feedwater Tank OUT; deliver to a Water Tank, Feedwater Tank IN/RETURN, Boiler WATER, Steam Generator, Condenser or Deaerator WATER_IN. Pipes may run through valves, elbows, check valves and economizer water side.',
  gearpump:'Custom gear pump for tank-to-tank transfer. Two drive modes: energise L/N/PE for the integral motor, or wire a coupling/gearbox/belt from an engine or turbine SHAFT terminal for mechanical drive. SUC (in) ← lower tank OUT, DIS (out) → upper tank IN. High discharge pressure and high flow — adjust HP, flow and pressure factors in Properties.',
  silo:'Large silo-style water storage tank. Pipe IN to fill and OUT to distribute — same hydraulics as a Water Tank but with a taller, higher-capacity vessel. Float switches, level gauges and tank-to-tank transfer all work with it.',
  silopump:'Silo tank with an integrated transfer pump. Fill the silo at IN (gravity or pumped); the built-in pump draws from the tank through OUT→SUC internally and delivers pressurized water at DIS. Wire L/N/PE for the pump motor — no external pump needed.',
  lamp:'Indicating lamp. Wire across a live–neutral pair; it lights when that circuit is live.',
  junction:'Four-way electrical node for splitting L, N or PE without extra terminals.',
  tank:'Storage vessel. Pipe IN from the pump discharge and OUT to consumers. Level drives the float switch.',
  sump:'Unlimited or limited water source. Pipe OUT to pump suction.',
  tee:'Four-port water junction for branching pipes.',
  valve:'Throttling control valve. Place in series on the discharge; opening^1.5 sets flow.',
  tap:'Consumer draw-off. Pipe IN from a tank outlet; open to drain the tank.',
  gauge:'Bourdon pressure gauge. Tee the IN impulse onto a water, steam or gas line; it does not pass flow.',
  flowmeter:'In-line meter. Pipe IN→OUT in series with water, steam or gas. Units follow the detected fluid.',
  tempgauge:'Filled-system thermometer. Tee IN onto the process line; reads water, steam or gas temperature.',
  levelgauge:'Local level glass. Pipe IN to a vessel nozzle (tank, feedwater, LPG or gas holder).',
  dpgauge:'Differential gauge. HI to the high-pressure tap, LO to the low-pressure tap on any fluid.',
  vacuumgauge:'Compound/vacuum gauge. Tee onto pump suction, condenser steam or compressor inlet.',
  rotameter:'Variable-area meter. Pipe IN→OUT in series; float height tracks water, steam or gas flow.',
  checkvalve:'Non-return valve. Flow IN→OUT only; reverse flow is blocked.',
  reliefvalve:'Safety valve. Opens from IN to OUT when inlet pressure exceeds the set point.',
  pressurecutoff:'Latched high-pressure trip. Closes the through-path at the set pressure until reset.',
  timer:'Coil on A1–A2; timed contact COM–NO / COM–NC. Use for delayed pump start or stop.',
  accumulator:'Bladder accumulator on a one-port branch. Charges above precharge and feeds back when pressure falls.',
  filter:'In-line strainer. Pipe IN→OUT; a clogged element blocks the line and raises ΔP.',
  manifold:'One inlet to three outlets. Use for distribution headers.',
  solar:'Photovoltaic module/array with realistic STC rating, temperature derating, dynamic irradiance (clouds) and soiling. Wire +/− to a charge controller, hybrid inverter or DC bus. Output follows irradiance × area × efficiency, corrected for cell temperature.',
  battery:'Bank with separate charge (IN+/IN−) and load (OUT+/OUT−) poles, common by polarity.',
  hybrid:'Hybrid solar inverter: PV (MPPT) in, battery bank, AC grid in, optional generator in, AC load out. Picks solar/battery, grid or generator automatically and charges the battery from PV, grid or generator. Works with lead-acid or LiFePO4 packs (wire via BMS P+/P− for LFP).',
  lfpbattery:'LiFePO4 pack. **OUT+ / OUT−** feed the hybrid inverter BAT+/BAT− (or BMS PACK then P+ to inverter). **IN+ / IN−** are for external chargers only. Typical 16S ≈ 51.2 V nom / 58.4 V full. Do not leave OUT unconnected if the hybrid should run from the battery.',
  bms:'LFP BMS. PACK+/PACK− from the battery, P+/P− to the inverter, C+/C− to a charger, CAN_H/CAN_L to an LFP hybrid. Opens charge or discharge MOSFETs on OV, UV, over-current or temperature.',
  hybridlfp:'Hybrid inverter for LiFePO4: PV MPPT, battery (via BMS), grid, optional generator, AC load, CAN to BMS. Uses LFP CC/CV (no lead-acid absorb). Default 48 V / 16S.',
  hybridlfpgt:'Grid-tie hybrid for LiFePO4. PV + battery + grid + AC load + CAN. Can export surplus PV to the grid up to the export limit. No generator port.',
  hybridbms:'LFP hybrid + integrated BMS. Wire battery **OUT+→BAT+**, **OUT−→BAT−**. Solar to PV+/PV−. AC loads to OUT_L/OUT_N. Click unit or Properties → Toggle ON/Reset trip. 0/5000 W means no AC load yet — add a lamp/motor on OUT; PV line still charges the battery.',

  acvawmeter:'Series AC volt/amp/watt meter. Wire L_in/N_in from the source and L_out/N_out to the load. Reads V, A, W and accumulates kWh.',
  dcvawmeter:'Series DC volt/amp/watt meter. Wire +_in/−_in from the DC source or BMS and +_out/−_out to the load or inverter. Reads V, A, W and accumulates kWh.',
  inverter:'Inverter/charger. DC+/DC− from battery, AC L/N out to loads. Optional AC IN (bottom) passes grid through and charges the battery. Compatible with LFP when the DC bus is the BMS P+/P− output.',
  chargecontroller:'PV+ / PV− in, BAT+ / BAT− out. MPPT or PWM charging.',
  dcsource:'Regulated DC supply. Wire + and − to DC loads or a charger.',
  batterycharger:'AC_L/AC_N in, isolated DC+/DC− out to battery IN+/IN−. Current-limited charge.',
  generator:'Engine generator. L/N/PE output while running and fuel remains.',
  transformer:'Isolating transformer. PRI_L/N to source, SEC_L/N to the load.',
  wind:'Horizontal-axis wind turbine with realistic power curve (½ρAv³Cp). Dynamic wind with turbulence/gusts, rotor RPM, and cut-in / rated / cut-out regions. Wire +/− to a DC bus, charge controller or battery. Adjust rotor diameter, air density and efficiency for different turbine sizes.',
  capacitorbank:'PFC bank. Close the connector to put A–B on the AC bus.',
  supercap:'High-capacitance DC store. Wire +/− like a small battery.',
  fuse:'Series fuse. Replace after it blows on overcurrent.',
  spd:'Surge protector. Bond L, N and PE near the incoming supply.',
  earthrod:'Site earth. Connect PE here so earth faults have a return.',
  lightning:'Lightning arrester. Line to L, earth to PE.',
  relay:'Auxiliary relay. Coil A1–A2, change-over COM–NO/NC.',
  ssr:'Solid-state relay. DC +/− control, A1–A2 power path.',
  selector:'Break-before-make switch. COM to POS1/2/3, or OFF isolates COM.',
  transfer:'Change-over. COM to NORM or EMER source.',
  ats:'Automatic transfer switch. Monitors up to four independent AC sources and connects one healthy source to LOAD_L/LOAD_N with break-before-make transfer logic.',
  disconnect:'Visible isolator. Opens L and N together.',
  plc:'Small controller. Power L/N, field I1/I2 in, O1/O2 out.',
  vfd:'Variable-frequency drive. L1/L2/L3/PE in, U/V/W to a three-phase motor.',
  softstart:'Reduced-voltage starter. L1–3 in, T1–3 out to the motor.',
  pid:'PID loop. PV and SP in, OUT to an actuator.',
  ct:'Current transformer. P1–P2 in series with the primary, S1–S2 to the meter.',
  vt:'Voltage transformer. P1–P2 across the primary, S1–S2 to the meter.',
  energymeter:'kWh meter. Wire L and N in parallel with the feeder you want to totalise.',
  pfccap:'Single PFC capacitor. A–B across the AC supply when connected.',
  heater:'Resistive heater. L/N; temperature rises while powered.',
  fan:'Cooling fan. L/N; speed follows power.',
  ledstrip:'DC lighting. +/− ; brightness follows power.',
  solenoid:'Pilot solenoid. +/− coil; open while energised.',
  acmotor:'General-purpose single-phase AC induction motor. Wire L/N/PE. Adjustable HP, PF, efficiency and inrush. Draw current only while powered.',
  dcmotor:'Brushed or BLDC-style DC motor. Wire +/− from a DC source or BMS. Adjustable watts, voltage, efficiency and speed %.',

  gasturbine:'Gas turbine-generator. Needs gas at GAS_IN and air at AIR_IN. EXHAUST (flue gas) can feed an economizer/superheater FLUE_IN. L/N/PE live when generating.',
  steamturbine:'Steam turbine-generator. STEAM_IN in, condensate/exhaust out, L/N/PE when generating.',
  boiler:'Fired boiler. FUEL and WATER in, STEAM out. Needs both services and a Run command.',
  condenser:'Steam condenser. STEAM_IN plus cooling WATER_IN, CONDENSATE out.',
  coolingtower:'Rejects heat. HOT_IN from the condenser, COLD_OUT back to it.',
  gascompressor:'Gas booster. Process IN/OUT plus motor M/N. Will not pass gas until electrically live.',
  gasboosterpump:'Gas booster pump. Raises gas pressure. Needs gas at IN, a live supply across M/N, and a Start command. OUT feeds burners, furnaces and turbines.',
  airsupply:'Combustion air source — electrically driven forced-draft blower, or an unlimited ambient vent. Wire the motor supply to L / N (and PE for earthing); pipe OUT to AIR_IN on burners, combustion chambers, furnaces and gas turbines. The blower only delivers air while it is switched on AND live across L–N; it spins up gradually and draws motor current. Enable Unlimited for an always-available atmospheric supply that needs no power.',
  fluestack:'Flue stack / chimney. FLUE_IN only. Every FLUE_OUT must reach a stack, otherwise the exhaust is blocked and heat recovery stops.',
  gasvalve:'Manual/isolation gas valve. Open to pass IN→OUT.',
  gasfilter:'Gas strainer. IN→OUT; clogging isolates the downstream consumer.',
  gasmeter:'Custody gas meter. IN→OUT in series; totals only with supply and demand.',
  pressureregulator:'Lets down gas. IN from the high side, OUT at the setpoint.',
  gastank:'Pressurised gas holder. IN to fill, OUT to consumers.',
  gaswell:'Wellhead source. Open OUT onto the gas header.',
  naturalgas:'Utility gas source. OUT onto the gas header while on.',
  lpgtank:'LPG bullet. OUT to vapor-consuming equipment.',
  burner:'Gas burner. Needs BOTH gas at GAS_IN and air at AIR_IN (Air Supply Source) to light. FLAME_OUT carries flue gas to FLUE_IN of a heat exchanger.',
  combustionchamber:'Combustor. Needs fuel gas at FUEL_IN and air at AIR_IN. FLAME_OUT carries flue gas onward.',
  flame:'Pilot flame. FUEL_IN; click to light when gas is available.',
  furnace:'Process furnace. Needs fuel gas at FUEL_IN and air at AIR_IN. HEAT_OUT carries flue gas onward.',
  steamsource:'Live steam header. STEAM_OUT to turbines; optional WATER_IN make-up.',
  steamgenerator:'Fired steam generator. FUEL_IN and WATER_IN, STEAM_OUT.',
  steampipe:'Insulated steam run. IN→OUT; carries pressure and temperature to gauges.',
  steamtrap:'Discharges condensate. IN from steam, OUT/COND when open.',
  steamseparator:'Knock-out. IN mixed, STEAM out the top, WATER out the bottom.',
  feedwaterpump:'Boiler feed pump. Water IN/OUT plus motor M/N. Needs a live electrical supply.',
  steamboosterpump:'Steam booster pump (thermo-compressor drive). Raises steam pressure. Needs steam at IN, a live supply across M/N, and a Start command.',
  economizer:'Feedwater heater. WATER_IN/OUT plus FLUE_IN/OUT. REQUIRES hot flue gas from a burner, furnace, combustion chamber or gas-turbine EXHAUST at FLUE_IN, and FLUE_OUT piped on to a Flue Stack.',
  superheater:'Raises steam temperature. STEAM_IN/OUT plus FLUE_IN/OUT. REQUIRES hot flue gas at FLUE_IN and FLUE_OUT piped on to a Flue Stack; otherwise steam leaves unheated.',
  reheater:'Reheats turbine exhaust steam. STEAM_IN/OUT plus FLUE_IN/OUT. REQUIRES hot flue gas at FLUE_IN and FLUE_OUT piped on to a Flue Stack; otherwise steam leaves unheated.',
  deaerator:'Removes dissolved gas. STEAM_IN and WATER_IN, WATER_OUT to the feed pump.',
  lpsystem:'Low-pressure steam/water corridor. IN→OUT at ~5 bar.',
  hpsystem:'High-pressure steam corridor. IN→OUT at ~160 bar.',
  feedwatertank:'Deaerated storage. IN / RETURN in, OUT to the feed pump.',
  blowdown:'Boiler blowdown. Open IN→OUT to dump concentrated water.',
  governor:'Speed governor. SPEED in, VALVE out to the steam/fuel valve.',
  exciter:'Generator exciter. FIELD/ARMATURE in, OUTPUT to the rotor.',
  syncrelay:'Synchronising relay. Bus V_L/V_N vs generator G_L/G_N.',
  avr:'Automatic voltage regulator. SPEED/VOLTAGE in, FIELD out.',
  busbar:'HV/LV bus. L1/L2/L3/N are bonded as a distribution bar.',
  hvbreaker:'High-voltage breaker. L/N in, L_out/N_out out.',
  transformerhv:'HV/LV transformer. PRI and SEC L/N pairs.',
  reactor:'Shunt reactor. L/N on the HV bus for VAr absorption.',
  differentialrelay:'87 differential. Compare CT1 and CT2; TRIP on mismatch.',
  overcurrentrelay:'51 overcurrent. CT_IN from a CT, TRIP to a breaker coil.',
  distanceprotection:'21 distance. V and I in, TRIP out by zone.',
  synchroscope:'Shows slip and angle. Wire generator and bus voltages and frequencies.',
  generatorprotection:'Multi-function 40/32/81/… package. CTs/VTs in, TRIP out.',
  gatevalve:'Full-bore isolation. Open the wheel to pass IN→OUT (any compatible fluid).',
  globevalve:'Throttling globe. Open to pass IN→OUT.',
  ballvalve:'Quarter-turn ball. Open to pass IN→OUT.',
  butterflyvalve:'Wafer butterfly. Open to pass IN→OUT.',
  expansionjoint:'Bellows joint. IN→OUT; expansion follows line temperature.',
  flange:'Paired flanges. IN→OUT; use to join dissimilar spools.',
  gasket:'Joint gasket. IN→OUT between flanges.',
  pipesupport:'Rest or spring hanger. Clip onto a nearby PIPE run; it does not pass fluid.',
  reducer:'Concentric reducer. IN (large) to OUT (small).',
  teejoint:'Process tee. IN splits to OUT1 and OUT2.',
  elbow90:'90° elbow. IN to OUT.',
  elbow45:'45° elbow. IN to OUT.',

  watersensor:'Water pressure transmitter. Tee its IN port onto a water line; configure range, span, offset and fault simulation.',
  waterflowsensor:'Water flow transmitter. Tee onto a water line to read simulated flow in L/min.',
  waterlevelsensor:'Hydrostatic water level transmitter. Connect to a water vessel/line instrument point; displays level in percent.',
  watertempsensor:'RTD/thermocouple-style water temperature transmitter with adjustable range and calibration.',
  steampressure:'High-range steam pressure transmitter for boiler and steam-header monitoring.',
  steamtemp:'Steam temperature transmitter for saturated/superheated steam service.',
  steamflow:'Steam mass-flow transmitter with kg/h engineering units.',
  steamquality:'Steam dryness/quality analyzer; adjustable quality reading.',
  gaspressure:'Gas pressure transmitter for natural gas/LPG pressure monitoring.',
  gasflow:'Gas flow transmitter with Nm³/h units.',
  gaslevel:'Gas vessel level transmitter for LPG/gas storage inventory indication.',
  gasdetector:'Combustible gas detector with adjustable alarm and trip thresholds in %LEL.',
  oxygenanalyzer:'Oxygen analyzer for combustion/process gas monitoring.',
  phsensor:'Water pH analyzer with configurable span and calibration.',
  conductivity:'Water conductivity analyzer for dissolved-solids/process-water monitoring.',
  humiditysensor:'Gas moisture/humidity transmitter with %RH output.',
};
const LINKS={ // internal closed conduction paths
  battery:()=>[['IN+','OUT+'],['IN-','OUT-']],
  lfpbattery:()=>[['IN+','OUT+'],['IN-','OUT-']],
  bms:c=>{if(!c.on)return[['PACK-','P-'],['PACK-','C-']];const a=[['PACK-','P-'],['PACK-','C-']];if(c.dsgOk)a.push(['PACK+','P+']);if(c.chgOk)a.push(['PACK+','C+']);if(c.dsgOk&&c.chgOk)a.push(['P+','C+']);return a;},
  acvawmeter:()=>[['L_in','L_out'],['N_in','N_out']],
  dcvawmeter:()=>[['+_in','+_out'],['-_in','-_out']],
  acbreaker:c=>c.closed&&!c.tripped?[['L_in','L_out'],['N_in','N_out']]:[],
  dcbreaker:c=>c.closed&&!c.tripped?[['+_in','+_out'],['-_in','-_out']]:[],
  mcb:c=>c.closed&&!c.tripped?[['Lin','Lout'],['Nin','Nout']]:[],
  rcd:c=>c.closed&&!c.tripped?[['Lin','Lout'],['Nin','Nout']]:[],
  overload:c=>c.tripped?[]:[['in','out']],
  float:c=>[['COM',floatPos(c)]],
  contactor:c=>(c.coilOn||c.fault==='weld')?[['L1','T1'],['L2','T2'],['13','14']]:[],
  timer:c=>c.output?[['COM','NO']]:[['COM','NC']],
  switch:c=>c.closed?[['a','b']]:[],
  pb:c=>((c.nc&&!c.pressed)||(!c.nc&&c.pressed))?[['a','b']]:[],
  junction:()=>[['t','r'],['r','b'],['b','l']],
  valve:c=>c.open?[['a','b']]:[],
  checkvalve:c=>c.open?[['IN','OUT']]:[],
  manifold:()=>[['IN','OUT1'],['IN','OUT2'],['IN','OUT3']],
  flowmeter:c=>[['IN','OUT']],
  filter:c=>c.clogged?[]:[['IN','OUT']],
  reliefvalve:c=>c.open?[['IN','OUT']]:[],
  inverter:c=>(c.on&&c._bypass)?[['IN_L','AC_L'],['IN_N','AC_N']]:[],
  chargecontroller:c=>c.on?[['PV+','BAT+'],['PV-','BAT-']]:[],
  fuse:c=>!c.blown?[['a','b']]:[],
  disconnect:c=>c.closed?[['L','L_out'],['N','N_out']]:[],
  relay:c=>c.coilOn?(c.contact==='NO'?[['COM','NO']]:[['COM','NC']]):(c.contact==='NO'?[['COM','NC']]:[['COM','NO']]),
  ssr:c=>c.on?[['+','A1'],['-','A2']]:[],
  transfer:c=>c.position==='norm'?[['COM','NORM']]:[['COM','EMER']],
  ats:c=>{if((Number(c._dead)||0)>0)return [];const n=Number(c._active)||0;return n>=1&&n<=4?[[`SRC${n}_L`,'LOAD_L'],[`SRC${n}_N`,'LOAD_N']]:[]},
  selector:c=>Number(c.position)===1?[['COM','POS1']]:Number(c.position)===2?[['COM','POS2']]:Number(c.position)===3?[['COM','POS3']]:[],
  transformer:c=>[['PRI_L','SEC_L'],['PRI_N','SEC_N']],
  pfccap:c=>c.connected?[['A','B']]:[],
  capacitorbank:c=>c.connected?[['A','B']]:[],
  hvbreaker:c=>c.closed&&!c.tripped?[['L','L_out'],['N','N_out']]:[],
  busbar:()=>[['L1','L2'],['L2','L3'],['L3','N']],
  transformerhv:c=>[['PRI_L','SEC_L'],['PRI_N','SEC_N']],
  gascompressor:c=>c.on?[['IN','OUT']]:[],
  gasboosterpump:c=>c.on?[['IN','OUT']]:[],
  steamboosterpump:c=>c.on?[['IN','OUT']]:[],
  gasvalve:c=>c.open?[['IN','OUT']]:[],
  steamtrap:c=>c.open?[['IN','OUT'],['IN','COND']]:[],
  feedwaterpump:c=>c.on?[['IN','OUT']]:[],
  gatevalve:c=>c.open?[['IN','OUT']]:[],
  globevalve:c=>c.open?[['IN','OUT']]:[],
  expansionjoint:()=>[['IN','OUT']],
  flange:()=>[['IN','OUT']],
  gasket:()=>[['IN','OUT']],
  pipesupport:()=>[],
  levelgauge:()=>[['IN','IN']],
  dpgauge:()=>[['HI','HI'],['LO','LO']],
  vacuumgauge:()=>[['IN','IN']],
  rotameter:()=>[['IN','OUT']],
  ballvalve:c=>c.open?[['IN','OUT']]:[],
  butterflyvalve:c=>c.open?[['IN','OUT']]:[],
  steampipe:()=>[['IN','OUT']],
  reducer:()=>[['IN','OUT']],
  teejoint:()=>[['IN','OUT1'],['IN','OUT2']],
  elbow90:()=>[['IN','OUT']],
  elbow45:()=>[['IN','OUT']],
  economizer:()=>[['FLUE_IN','FLUE_OUT'],['WATER_IN','WATER_OUT']],
  superheater:()=>[['STEAM_IN','STEAM_OUT'],['FLUE_IN','FLUE_OUT']],
  reheater:()=>[['STEAM_IN','STEAM_OUT'],['FLUE_IN','FLUE_OUT']],
  steamseparator:()=>[['IN','STEAM'],['IN','WATER']],
  deaerator:()=>[['STEAM_IN','WATER_OUT'],['WATER_IN','WATER_OUT']],
  lpsystem:()=>[['IN','OUT']],
  hpsystem:()=>[['IN','OUT']],
  feedwatertank:()=>[['IN','OUT'],['RETURN','OUT']],
  gastank:()=>[['IN','OUT']],
  gaswell:c=>c.on?[['OUT','OUT']]:[],
  naturalgas:c=>c.on?[['OUT','OUT']]:[],
  airsupply:c=>airReady(c)?[['OUT','OUT']]:[],
  lpgtank:c=>[['OUT','OUT']],
  burner:c=>c.on?[['GAS_IN','FLAME_OUT'],['AIR_IN','FLAME_OUT']]:[],
  combustionchamber:c=>c.on?[['FUEL_IN','FLAME_OUT'],['AIR_IN','FLAME_OUT']]:[],
  steamsource:c=>c.on?[['STEAM_OUT','STEAM_OUT']]:[],
  steamgenerator:c=>c.on?[['FUEL_IN','STEAM_OUT'],['WATER_IN','STEAM_OUT']]:[],
  flame:c=>c.on?[['FUEL_IN','FUEL_IN']]:[],
  furnace:c=>c.on?[['FUEL_IN','HEAT_OUT'],['AIR_IN','HEAT_OUT']]:[],
  blowdown:c=>c.open?[['IN','OUT']]:[]
};
/* Air Supply is available when it is an open ambient vent, or its blower is on, electrically live, not jammed/tripped and spun up. */
function airReady(c){return !!(c.unlimited||(c.on&&c.powered&&!c.cutout&&c.fault!=='open'&&c.fault!=='stall'&&(c._spd===undefined||c._spd>0.6)));}
function floatPos(c){if(c.fault==='stuckNC')return'NC';if(c.fault==='stuckNO')return'NO';return c.up?'NO':'NC';}

/* ───────────── state ───────────── */
let comps=[],wires=[],nextId=1;
const view={x:60,y:40,z:1};
const sim={running:true,speed:1,volts:220,totalI:0,power:0,short:false,pumping:0,st:null,flow:new Set(),hu:null,hflow:new Set(),alarms:[],hazards:[],warnings:[]};
let selected=null,wiring=null,hoverTerm=null,drag=null,wireDrag=null,pan=null,marquee=null,multiSelected=new Set(),mouse={x:0,y:0,cx:0,cy:0};
let undoStack=[],redoStack=[],dirty=false,logs=[];
const flags={};
/* Game architecture: named systems register tick/reset without wrapping step N times. */
const Game={
  version:2,
  systems:[],
  register(name,sys){this.systems=this.systems.filter(s=>s.name!==name);this.systems.push(Object.assign({name},sys));},
  tick(dt,ctx){for(const s of this.systems){try{if(s.tick)s.tick(dt,ctx);}catch(err){console.warn('[Game]',s.name,err);}}},
  reset(){for(const s of this.systems){try{if(s.reset)s.reset();}catch(err){}}}
};
window.Game=Game;

/* ───────────── helpers ───────────── */
const snap=v=>Math.round(v/GRID)*GRID;
const rotv=(x,y,r)=>[[x,y],[-y,x],[-x,-y],[y,-x]][((r%4)+4)%4];
const key=(cid,t)=>cid+':'+t;
function isPack(c){return!!c&&(c.type==='battery'||c.type==='lfpbattery');}
function lfpCellV(soc){const s=Math.max(0,Math.min(100,Number(soc)||0));const pts=[[0,2.50],[5,3.00],[10,3.20],[20,3.25],[50,3.28],[80,3.33],[90,3.40],[95,3.50],[100,3.65]];for(let i=1;i<pts.length;i++)if(s<=pts[i][0]){const a=pts[i-1],b=pts[i];return a[1]+(b[1]-a[1])*((s-a[0])/Math.max(1e-9,b[0]-a[0]));}return 3.65;}
function packSeries(c){return Math.max(1,Number(c&&c.series)||(c&&c.type==='lfpbattery'?16:1));}
function packParallel(c){return Math.max(1,Number(c&&c.parallel)||1);}
function packAh(c){if(!c)return 100;if(c.type==='lfpbattery')return Math.max(.1,Number(c.cellAh)||100)*packParallel(c);return Math.max(1,Number(c.capacity)||100);}
function packNomV(c){if(!c)return 12;if(c.type==='lfpbattery')return packSeries(c)*Math.max(2,Number(c.cellNom)||3.2);return Math.max(1,Number(c.nomVoltage)||Number(c.voltage)||12);}
function packV(c){if(!c)return 12;if(c.type==='lfpbattery'){const I=Number(c._packI)||0,ri=(Number(c.cellRi)||2)/1000,r=ri*packSeries(c)/packParallel(c);return Math.max(0,lfpCellV(c.soc)*packSeries(c)-I*r);}return Math.max(1,Number(c.voltage)||12);}
/* ── series banks: pack X OUT+ wired to pack Y OUT− puts Y on top of X (their voltages add) ── */
let _wufSig='',_banks=[];
function packBankList(){
  const sig=wires.map(w=>(w.broken?'x':'')+w.a.c+w.a.t+'>'+w.b.c+w.b.t).join('|')+'#'+comps.filter(isPack).map(c=>c.id).join(',');
  if(sig===_wufSig)return _banks;
  const uf=makeUF();for(const w of wires)if(!w.broken&&!isPipe(w))uf.union(key(w.a.c,w.a.t),key(w.b.c,w.b.t));
  for(const c of comps)if(isPack(c)){uf.union(key(c.id,'IN+'),key(c.id,'OUT+'));uf.union(key(c.id,'IN-'),key(c.id,'OUT-'));}
  const ps=comps.filter(isPack),used=new Set(),out=[];
  const below=x=>ps.find(z=>z!==x&&uf.find(key(z.id,'OUT+'))===uf.find(key(x.id,'OUT-')));
  const above=x=>ps.find(z=>z!==x&&uf.find(key(z.id,'OUT-'))===uf.find(key(x.id,'OUT+')));
  for(const x of ps){if(used.has(x.id)||below(x))continue;
    const ch=[x];used.add(x.id);let cur=x,g=0;
    while(g++<32){const y=above(cur);if(!y||used.has(y.id))break;ch.push(y);used.add(y.id);cur=y;}
    out.push({packs:ch,bottom:ch[0],top:ch[ch.length-1]});}
  for(const x of ps)if(!used.has(x.id)){used.add(x.id);out.push({packs:[x],bottom:x,top:x});}
  _wufSig=sig;_banks=out;return out;}
function bankOf(c){return packBankList().find(b=>b.packs.includes(c))||{packs:[c],top:c,bottom:c};}
function bankNets(uf,b){return{p:uf.find(key(b.top.id,'OUT+')),n:uf.find(key(b.bottom.id,'OUT-'))};}
function bankV(c){const b=bankOf(c);return b.packs.length>1?b.packs.reduce((a,x)=>a+packV(x),0):packV(c);}
function bankNomV(c){const b=bankOf(c);return b.packs.length>1?b.packs.reduce((a,x)=>a+packNomV(x),0):packNomV(c);}
function packOnNet(uf,c,p,n){const b=bankOf(c);
  if(b.packs.length>1){if(c!==b.top)return false;
    return[[b.top,'IN+'],[b.top,'OUT+']].some(([o,t])=>uf.find(key(o.id,t))===p)&&[[b.bottom,'IN-'],[b.bottom,'OUT-']].some(([o,t])=>uf.find(key(o.id,t))===n);}
  const P=['IN+','OUT+'],N=['IN-','OUT-'];return P.some(t=>uf.find(key(c.id,t))===p)&&N.some(t=>uf.find(key(c.id,t))===n);}
function findPack(uf,p,n){return comps.find(b=>isPack(b)&&packOnNet(uf,b,p,n));}
function isHyb(c){return c&&(c.type==='hybrid'||c.type==='hybridlfp'||c.type==='hybridlfpgt'||c.type==='hybridbms');}
function lfpChargeTaper(bat){const s=Number(bat&&bat.soc)||0;if(!bat||s>=99.9)return 0;if(bat.type!=='lfpbattery')return s<80?1:Math.max(.1,(100-s)/20);const cv=Math.max(80,Math.min(99,Number(bat.cvSoc)||95));return s<cv?1:Math.max(.05,(100-s)/Math.max(1,100-cv));}
const getC=id=>comps.find(c=>c.id===id);
function termWorld(cid,tid){const c=getC(cid);if(!c)return null;const t=DEFS[c.type].term.find(q=>q[0]===tid);if(!t)return null;
  const p=rotv(t[1],t[2],c.rot),d=rotv(t[3],t[4],c.rot);return{x:c.x+p[0],y:c.y+p[1],dx:d[0],dy:d[1]};}
function log(msg){const t=new Date().toLocaleTimeString();logs.unshift(`[${t}] ${msg}`);if(logs.length>200)logs.pop();renderLog();}
function flag(k,v,on,off){const first=flags[k]===undefined;if(flags[k]===v)return;flags[k]=v;if(first&&!v)return;const m=v?on:off;if(m)log(m);}
function renderLog(){$('log').innerHTML=logs.slice(0,80).map(l=>`<div><i>${l.slice(0,10)}</i>${esc(l.slice(10))}</div>`).join('')||'<span class="note">No events yet.</span>';}
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const isSel=c=>selected&&selected.kind==='c'&&selected.id===c.id;

/* ───────────── undo / persistence ───────────── */
const snapshot=()=>JSON.stringify({comps,wires,nextId});
function pushUndo(){undoStack.push(snapshot());if(undoStack.length>60)undoStack.shift();redoStack=[];dirty=true;}
function restore(s){const o=JSON.parse(s);comps=o.comps;wires=o.wires;nextId=o.nextId;selected=null;wiring=null;renderProps();dirty=true;}
function undo(){if(!undoStack.length)return;redoStack.push(snapshot());restore(undoStack.pop());}
function redo(){if(!redoStack.length)return;undoStack.push(snapshot());restore(redoStack.pop());}
function savePayload(){const strip=o=>Array.isArray(o)?o.map(strip):(o&&typeof o==='object'?Object.fromEntries(Object.entries(o).filter(([k])=>k[0]!=='_').map(([k,v])=>[k,strip(v)])):o);
  return JSON.stringify({v:2,comps:strip(comps),wires:strip(wires),nextId});}
setInterval(()=>{if(!dirty)return;dirty=false;try{localStorage.setItem('circuitLab.v1',savePayload());}catch(e){}},2000);
function loadObj(o){comps=(o.comps||[]).filter(c=>DEFS[c.type]).map(c=>Object.assign({},JSON.parse(JSON.stringify(DEFS[c.type].init)),c));
  const ids=new Set(comps.map(c=>c.id));wires=(o.wires||[]).filter(w=>ids.has(w.a.c)&&ids.has(w.b.c));
  nextId=o.nextId||(Math.max(0,...comps.map(c=>c.id),...wires.map(w=>w.id))+1);selected=null;wiring=null;renderProps();}

/* ───────────── editing ───────────── */
function newComp(type,x,y,rot){const d=DEFS[type];const c=Object.assign({id:nextId++,type,x,y,rot:rot||0},JSON.parse(JSON.stringify(d.init)));
  c.label=d.tag+(comps.filter(k=>k.type===type).length+1);return c;}
function addComp(type,x,y){pushUndo();const c=newComp(type,snap(x),snap(y));comps.push(c);selected={kind:'c',id:c.id};renderProps();log(`Added ${c.label} (${DEFS[type].name})`);return c;}
function delSel(){if(multiSelected.size){pushUndo();const ids=new Set(multiSelected);wires=wires.filter(w=>!ids.has(w.a.c)&&!ids.has(w.b.c));comps=comps.filter(c=>!ids.has(c.id));multiSelected.clear();selected=null;renderProps();return;}if(!selected)return;pushUndo();
  if(selected.kind==='c'){wires=wires.filter(w=>w.a.c!==selected.id&&w.b.c!==selected.id);comps=comps.filter(c=>c.id!==selected.id);}
  else wires=wires.filter(w=>w.id!==selected.id);
  selected=null;renderProps();}
function rotSel(){const c=selObj();if(!c||selected.kind!=='c')return;pushUndo();c.rot=(c.rot+1)%4;}
function dupSel(){const c=selObj();if(!c||selected.kind!=='c')return;pushUndo();const n=newComp(c.type,c.x+40,c.y+40,c.rot);
  for(const k of Object.keys(DEFS[c.type].init))n[k]=c[k];comps.push(n);selected={kind:'c',id:n.id};renderProps();}
const selObj=()=>!selected?null:selected.kind==='c'?getC(selected.id):wires.find(w=>w.id===selected.id);
function addWire(a,b,pts){if(a.c===b.c&&a.t===b.t)return;
  if(tkind(a)!==tkind(b)){log('⚠ Cannot join an electrical terminal to a hydraulic port.');return;}
  // Additional validation for hydraulic subtypes
  if(tkind(a)==='h'){
    const compA=getC(a.c),compB=getC(b.c);
    const catA=compA?DEFS[compA.type].cat:'',catB=compB?DEFS[compB.type].cat:'';
    const isGasA=catA.includes('Gas'),isGasB=catB.includes('Gas');
    const isSteamA=catA.includes('Steam'),isSteamB=catB.includes('Steam');
    const isHydroA=catA.includes('Hydraulic'),isHydroB=catB.includes('Hydraulic');
    // Prevent mixing gas, steam, and water systems
    if((isGasA||isGasB)&&!(isGasA&&isGasB)){log('⚠ Cannot join gas system with non-gas system.');return;}
    if((isSteamA||isSteamB)&&!(isSteamA&&isSteamB)){log('⚠ Cannot join steam system with non-steam system.');return;}
  }
  if(wires.some(w=>(w.a.c===a.c&&w.a.t===a.t&&w.b.c===b.c&&w.b.t===b.t)||(w.a.c===b.c&&w.a.t===b.t&&w.b.c===a.c&&w.b.t===a.t)))return;
  pushUndo();const w={id:nextId++,a:{c:a.c,t:a.t},b:{c:b.c,t:b.t},pts:pts||[],bend:0,broken:false,color:tkind(a)==='h'?'#59c3ff':'#ff9f1c',style:'industrial',trace:true};wires.push(w);
  log(`${tkind(a)==='h'?'Pipe':'Wire'} ${getC(a.c).label}.${a.t} → ${getC(b.c).label}.${b.t}`);selected={kind:'w',id:w.id};renderProps();}

/* ───────────── wire routing ───────────── */
function clean(P){const o=[];for(const p of P){const l=o[o.length-1];if(!l||l.x!==p.x||l.y!==p.y)o.push({x:p.x,y:p.y});}return o;}
function routeWire(w){
  const A=termWorld(w.a.c,w.a.t),B=termWorld(w.b.c,w.b.t);if(!A||!B)return null;
  if(w.pts&&w.pts.length){
    const P=[{x:A.x,y:A.y}];let cur=P[0];
    w.pts.forEach((n,i)=>{if(cur.x!==n.x&&cur.y!==n.y){P.push(i===0?(A.dx!==0?{x:n.x,y:cur.y}:{x:cur.x,y:n.y}):{x:n.x,y:cur.y});}P.push({x:n.x,y:n.y});cur=n;});
    if(cur.x!==B.x&&cur.y!==B.y)P.push(B.dx!==0?{x:cur.x,y:B.y}:{x:B.x,y:cur.y});
    P.push({x:B.x,y:B.y});return clean(P);
  }
  const st=20,s1={x:A.x+A.dx*st,y:A.y+A.dy*st},s2={x:B.x+B.dx*st,y:B.y+B.dy*st};
  const P=[{x:A.x,y:A.y},s1],ha=A.dx!==0,hb=B.dx!==0;
  if(ha&&hb){let mx;if(A.dx===-B.dx&&(s2.x-s1.x)*A.dx>0)mx=(s1.x+s2.x)/2;else mx=A.dx>0?Math.max(s1.x,s2.x)+20:Math.min(s1.x,s2.x)-20;mx+=w.bend||0;P.push({x:mx,y:s1.y},{x:mx,y:s2.y});}
  else if(!ha&&!hb){let my;if(A.dy===-B.dy&&(s2.y-s1.y)*A.dy>0)my=(s1.y+s2.y)/2;else my=A.dy>0?Math.max(s1.y,s2.y)+20:Math.min(s1.y,s2.y)-20;my+=w.bend||0;P.push({x:s1.x,y:my},{x:s2.x,y:my});}
  else if(ha&&!hb)P.push({x:s2.x,y:s1.y});
  else P.push({x:s1.x,y:s2.y});
  P.push(s2,{x:B.x,y:B.y});return clean(P);
}

/* ───────────── circuit solver ───────────── */
function tkind(r){const c=getC(r.c);if(!c)return'e';const t=DEFS[c.type].term.find(q=>q[0]===r.t);return t&&t[5]==='h'?'h':'e';}
function isPipe(w){return tkind(w.a)==='h';}
function isSrc(r){const c=getC(r.c);return!!c&&((c.type==='sump'&&r.t==='OUT')||(c.type==='motor'&&r.t==='DIS')||(c.type==='gearpump'&&r.t==='DIS')||(c.type==='valve'&&r.t==='b')||(['gatevalve','globevalve','ballvalve','butterflyvalve','filter','flowmeter','rotameter','expansionjoint','flange','gasket','reducer','pressurecutoff','reliefvalve'].includes(c.type)&&r.t==='OUT')||(c.type==='tank'&&r.t==='OUT')||((c.type==='silo'||c.type==='silopump')&&r.t==='OUT'));}
function pipeDir(w){return(isSrc(w.b)&&!isSrc(w.a))?-1:1;}
function buildHUF(){const uf=makeUF();for(const w of wires)if(isPipe(w)&&!w.broken)uf.union(key(w.a.c,w.a.t),key(w.b.c,w.b.t));
  for(const c of comps){
    const ports=new Set((DEFS[c.type]?.term||[]).filter(t=>t[5]==='h').map(t=>t[0]));
    const join=(a,b)=>{if(ports.has(a)&&ports.has(b))uf.union(key(c.id,a),key(c.id,b));};
    // Inline hydraulic components must be continuous when in their pass-through state.
    // Previously several plumbing valves and fittings had hydraulic terminals but no
    // continuity rule, so wires appeared connected while the hydraulic solver saw a dead end.
    if(c.type==='valve'&&(c.flowPercent??25)>0)join('a','b');
    if(c.type==='pressurecutoff'&&!c.tripped)join('IN','OUT');
    if((c.type==='filter'&&!c.clogged)||c.type==='flowmeter'||(c.type==='rotameter')||
       (c.type==='reliefvalve'&&c.open)||c.type==='expansionjoint'||c.type==='flange'||
       c.type==='gasket'||c.type==='reducer')join('IN','OUT');
    if(['gatevalve','globevalve','ballvalve','butterflyvalve'].includes(c.type)&&c.open&&(c.opening??100)>0)join('IN','OUT');
    if(c.type==='gasvalve'&&c.open&&(c.opening??100)>0)join('IN','OUT');
    if(c.type==='elbow90'||c.type==='elbow45')join('IN','OUT');
    if(c.type==='economizer'||c.type==='deaerator')join('WATER_IN','WATER_OUT');
    if(c.type==='blowdown'&&c.open)join('IN','OUT');
    if(c.type==='steamtrap'&&c.open)join('IN','OUT');
    if(c.type==='tee'){join('t','r');join('r','b');join('b','l');}
    if(c.type==='steamheader'){join('IN1','IN2');join('IN2','IN3');join('IN3','OUT');}
    if(c.type==='desuperheater')join('STEAM_IN','STEAM_OUT');
    if(c.type==='flashtank')join('STEAM_IN','STEAM_OUT');
    if(c.type==='airreceiver')join('AIR_IN','AIR_OUT');
    if(c.type==='silopump')uf.union(key(c.id,'SUC'),key(c.id,'OUT')); // internal pump suction = tank inventory
    if(c.type==='teejoint'){join('IN','OUT1');join('IN','OUT2');}
  }return uf;}
function makeUF(){const p=new Map();
  const find=x=>{if(!p.has(x))p.set(x,x);while(p.get(x)!==x){p.set(x,p.get(p.get(x)));x=p.get(x);}return x;};
  return{find,union:(a,b)=>{const ra=find(a),rb=find(b);if(ra!==rb)p.set(ra,rb);}};}
LINKS.hybrid=c=>{if(!c.on)return[];const a=[['GRID_PE','OUT_PE'],['GEN_PE','OUT_PE']];
  if(c._bypass==='GRID')a.push(['GRID_L','OUT_L'],['GRID_N','OUT_N']);
  else if(c._bypass==='GEN')a.push(['GEN_L','OUT_L'],['GEN_N','OUT_N']);return a;};
LINKS.lfpbattery=()=>[['IN+','OUT+'],['IN-','OUT-']];
LINKS.battery=()=>[['IN+','OUT+'],['IN-','OUT-']];
LINKS.hybridlfp=LINKS.hybrid;
LINKS.hybridbms=LINKS.hybrid;
LINKS.hybridlfpgt=c=>{if(!c.on)return[];const a=[['GRID_PE','OUT_PE']];if(c._bypass==='GRID')a.push(['GRID_L','OUT_L'],['GRID_N','OUT_N']);return a;};
function buildUF(skipATS=false){const uf=makeUF();
  for(const w of wires)if(!w.broken&&!isPipe(w))uf.union(key(w.a.c,w.a.t),key(w.b.c,w.b.t));
  for(const c of comps){if(skipATS&&c.type==='ats')continue;const f=LINKS[c.type];if(!f)continue;for(const[a,b]of f(c))uf.union(key(c.id,a),key(c.id,b));}
  return uf;}
function classify(uf){const m=new Map();let short=false,bond=false;
  const set=(r,ty)=>{const o=m.get(r);if(!o)m.set(r,ty);else if(o!==ty){if(o==='L'||ty==='L')short=true;else bond=true;}};
  for(const c of comps)if(c.type==='source'&&c.on){set(uf.find(key(c.id,'L')),'L');set(uf.find(key(c.id,'N')),'N');set(uf.find(key(c.id,'PE')),'PE');}
  // Running generators are independent AC sources.
  for(const c of comps)if(c.type==='generator'&&c.on&&Number(c.fuel)>0){set(uf.find(key(c.id,'L')),'L');set(uf.find(key(c.id,'N')),'N');set(uf.find(key(c.id,'PE')),'PE');}
  // Battery supplies DC only from its output terminals when state of charge is nonzero.
  // Packs wired OUT+ → OUT− form one series bank: only the bank's outer terminals are sources.
  for(const bk of packBankList())if(bk.packs.every(x=>Number(x.soc)>0)){
    const nt=bankNets(uf,bk);set(nt.p,'L');set(nt.n,'N');
  }
  // AC-to-DC chargers are isolated conversion sources: never bridge AC input nets to DC output nets.
  for(const c of comps)if(c.type==='batterycharger'&&c.on){
    const acL=m.get(uf.find(key(c.id,'AC_L'))),acN=m.get(uf.find(key(c.id,'AC_N')));
    if(acL==='L'&&acN==='N'){set(uf.find(key(c.id,'DC+')),'L');set(uf.find(key(c.id,'DC-')),'N');}
  }
  return{m,short,bond};}
const ntype=(st,c,t)=>st.cl.m.get(st.uf.find(key(c.id,t)));
function live(st,c,a,b){const x=ntype(st,c,a),y=ntype(st,c,b);return(x==='L'&&y==='N')||(x==='N'&&y==='L');}
function updateATSSelection(){
  const now=performance.now();
  for(const a of comps.filter(c=>c.type==='ats')){
    const uf0=buildUF(true),cl0=classify(uf0);
    const healthy=[1,2,3,4].map(i=>live({uf:uf0,cl:cl0},a,`SRC${i}_L`,`SRC${i}_N`));
    a._healthy=healthy;
    const current=Number(a._active)||0;
    const currentOK=current>=1&&current<=4&&healthy[current-1];
    const elapsed=Math.max(0,Math.min(0.25,((now-(a._lastEval||now))/1000)));
    a._lastEval=now;
    if((a._dead||0)>0){a._dead=Math.max(0,(a._dead||0)-elapsed);continue;}
    let wanted=current;
    if(a.mode==='manual') wanted=Math.max(1,Math.min(4,Number(a.manualInput)||1));
    else if(!currentOK){
      const pref=Math.max(1,Math.min(4,Number(a.priority)||1));
      const order=[pref,pref%4+1,(pref+1)%4+1,(pref+2)%4+1];
      wanted=order.find(i=>healthy[i-1])||0;
    }
    if(current===0&&wanted>0){a._active=wanted;a._timer=0;log(`${a.label} transferred to source ${wanted}`);}
    else if(wanted!==current){
      a._timer=(a._timer||0)+elapsed;
      if(a._timer>=Math.max(0,Number(a.transferDelay)||0)){
        a._active=wanted;a._timer=0;a._dead=wanted?Math.max(0,Number(a.deadTime)||0):0;a.transfers=(a.transfers||0)+1;
        log(`${a.label} automatic changeover: ${wanted?`source ${wanted}`:'LOAD isolated'}`);
      }
    }else a._timer=0;
  }
}
function evalCircuit(){
  updateATSSelection();
  let uf,cl;
  for(let it=0;it<8;it++){
    uf=buildUF();cl=classify(uf);let ch=false;
    if(!cl.short)for(const c of comps)if(c.type==='contactor'){
      const st={uf,cl};const on=c.fault!=='coilopen'&&live(st,c,'A1','A2');
      if(on!==c.coilOn){c.coilOn=on;ch=true;}}
    if(!ch)break;
  }
  return{uf,cl};
}
function handleShort(){
  const brs=comps.filter(c=>(c.type==='mcb'||c.type==='rcd'||c.type==='acbreaker'||c.type==='dcbreaker')&&c.closed&&!c.tripped);
  const ok=[];
  for(const b of brs){b.tripped=true;if(!evalCircuit().cl.short)ok.push(b);b.tripped=false;}
  if(ok.length){ok.sort((a,b)=>(a.rating||99)-(b.rating||99));const b=ok[0];b.tripped=true;log(`⚠ ${b.label} tripped: short circuit`);return;}
  if(brs.length){brs.forEach(b=>b.tripped=true);log('⚠ Short circuit: all breakers tripped');}
}
function nearest(c,list){let best=null,bd=1e18;for(const t of list){const d=(t.x-c.x)**2+(t.y-c.y)**2;if(d<bd){bd=d;best=t;}}return best;}
function tankOf(c){return nearest(c,comps.filter(t=>t.type==='tank'||t.type==='silo'||t.type==='silopump'));}

function solveHydraulics(hu,pumps,sumps,tanks,hflow,warnings,dt){
  const R=(c,t)=>hu.find(key(c.id,t)),INF=1e9;
  const srcs=[];for(const sp of sumps)if(sp.unlimited||sp.level>0)srcs.push({c:sp,net:R(sp,'OUT'),sump:true});
  // A tank is a hydraulic source for the pump solver only when its OUT is actually connected to a running pump suction.
  // Other tanks are storage boundaries: their OUT flow is handled separately as gravity transfer, not as an unlimited network source.
  for(const t of tanks)if(t.level>0&&pumps.some(p=>R(t,'OUT')===R(p,'SUC')))srcs.push({c:t,net:R(t,'OUT'),sump:false});
  // Universal destinations: storage vessels (Water Tank, Feedwater Tank IN + RETURN) and process water inlets
  // (Boiler drum, steam generator/source, condenser cooling water, cooling tower hot return).
  const lvlOf=c=>c.type==='boiler'?(Number(c.waterLevel)||0):(Number(c.level)||0);
  const sinks=[];
  for(const t of tanks){sinks.push({c:t,net:R(t,'IN')});if(t.type==='feedwatertank')sinks.push({c:t,net:R(t,'RETURN')});}
  const PROC={boiler:['WATER'],steamgenerator:['WATER_IN'],steamsource:['WATER_IN'],condenser:['WATER_IN'],coolingtower:['HOT_IN'],chwcondenser:['WATER_IN'],radiator:['WATER_IN'],engine4s:['COOL_IN']};
  for(const c of comps){const ports=PROC[c.type];if(!ports)continue;
    for(const t of ports)sinks.push({c,net:R(c,t),proc:true,cap:c.type==='boiler'?Math.max(0,100-lvlOf(c))/Math.max(dt,0.02):undefined});}
  // Hydraulic actuators stroke on demand: the pressurised port is a sink, the drain/return port a source.
  for(const c of comps){if(c.type!=='cylsingle'&&c.type!=='cyldouble')continue;const d=c._dir||0,rem=c.type==='cylsingle'?(d>0?1-(Number(c.pos)||0)/100:(Number(c.pos)||0)/100):(d>0?(Number(c.pos)||0)/100:1-(Number(c.pos)||0)/100);
    if(c.type==='cylsingle'){if(d>0)sinks.push({c,net:R(c,'IN'),cap:Math.max(.02,(Number(c.speed)||8)/100*rem)});if(d<0)srcs.push({c,net:R(c,'OUT')});}
    else if(d>0){sinks.push({c,net:R(c,'P1'),cap:Math.max(.02,(Number(c.speed)||8)/100*rem)});srcs.push({c,net:R(c,'P2')});}else if(d<0){sinks.push({c,net:R(c,'P2'),cap:Math.max(.02,(Number(c.speed)||8)/100*rem)});srcs.push({c,net:R(c,'P1')});}}
  // wetness / series depth: how many running pumps water has passed through
  const depth=new Map();srcs.forEach(x=>depth.set(x.net,0));
  for(let it=0;it<pumps.length+comps.filter(c=>(c.type==='checkvalve'||c.type==='poppetvalve')).length+2;it++){let ch=false;
    for(const p of pumps){const a=R(p,'SUC'),b=R(p,'DIS');if(depth.has(a)){const d=depth.get(a)+1;if(!depth.has(b)||depth.get(b)>d){depth.set(b,d);ch=true;}}}
    for(const cv of comps.filter(c=>(c.type==='checkvalve'||c.type==='poppetvalve'))){const a=R(cv,'IN'),b=R(cv,'OUT');if(depth.has(a)){const d=depth.get(a);if(!depth.has(b)||depth.get(b)>d){depth.set(b,d);ch=true;}}}
    for(const m of comps.filter(c=>c.type==='manifold'))for(const t of['OUT1','OUT2','OUT3']){if(m['o'+t.slice(3)]===false)continue;const a=R(m,'IN'),b=R(m,t);if(depth.has(a)){const d=depth.get(a);if(!depth.has(b)||depth.get(b)>d){depth.set(b,d);ch=true;}}}
    if(!ch)break;}
  const reach=sinks.filter(k=>depth.has(k.net));
  for(const p of pumps){p._wet=depth.has(R(p,'SUC'));let pen=0;
    if(reach.length){const lvl=reach.reduce((a,k)=>a+lvlOf(k.c),0)/reach.length/100,D=Math.max(1,Math.min(...reach.map(k=>depth.get(k.net))));pen=0.25*lvl/D;}
    // Educational transfer model: 1 HP pump nominally moves at most 0.12 tank-level percentage points/s.
    // A percentage-open control valve throttles flow non-linearly (opening^1.5); 0% is shut.
    // Flow also falls as the destination fills, approximating rising static head/back-pressure.
    const HYD_VLV=['gatevalve','globevalve','ballvalve','butterflyvalve','gasvalve'];
    const openValves=[...comps.filter(v=>v.type==='valve').map(v=>Math.max(0,Math.min(100,Number(v.flowPercent??25)))),...comps.filter(v=>HYD_VLV.includes(v.type)&&v.open).map(v=>Math.max(0,Math.min(100,Number(v.opening??100))))];
    const opening=openValves.length?Math.min(...openValves):100;
    const destLevel=reach.length?reach.reduce((a,k)=>a+lvlOf(k.c),0)/reach.length:0;
    const headFactor=Math.max(0.12,1-0.65*destLevel/100);
    const pumpCapacity=p.hp*0.12*(p.flowK||1)*(1-pen)*headFactor*(p.spin||0);
    const valveFactor=Math.pow(opening/100,1.5);
    p._cap=p._wet?pumpCapacity*valveFactor:0;}
  // max-flow network: S -> source -> u(net) -> pump -> d(net) -> sink -> T ; d(net)->u(net) allows series chains
  const N=new Map(),E=[],adj=[];
  const nid=x=>{if(!N.has(x))N.set(x,N.size);return N.get(x);};
  const addE=(u,v,c)=>{const a=nid(u),b=nid(v);adj[a]=adj[a]||[];adj[b]=adj[b]||[];E.push({u:a,v:b,c,f:0},{u:b,v:a,c:0,f:0});adj[a].push(E.length-2);adj[b].push(E.length-1);return E.length-2;};
  const S=nid('S'),T=nid('T');
  const pe=pumps.map(p=>addE('u'+R(p,'SUC'),'d'+R(p,'DIS'),p._cap));
  // Build directional hydraulic paths. Pipe-connected ports share a net; each net
  // transfers flow internally, while check valves only permit IN -> OUT flow.
  const nets=new Set();
  for(const c of comps)for(const term of (DEFS[c.type]?.term||[]))if(term[5]==='h')nets.add(R(c,term[0]));
  for(const n of nets)addE('d'+n,'u'+n,INF);
  const cvEdges=new Map();
  for(const cv of comps.filter(c=>(c.type==='checkvalve'||c.type==='poppetvalve'))){if(cv.type==='poppetvalve'&&cv.open===false)continue;cvEdges.set(cv.id,addE('u'+R(cv,'IN'),'d'+R(cv,'OUT'),INF));}
  const mfEdges=[];
  for(const m of comps.filter(c=>c.type==='manifold')){m._outF=[0,0,0];
    const feed=Math.max(0,...pumps.filter(p=>R(p,'DIS')===R(m,'IN')).map(p=>p._cap||0));
    const act=['OUT1','OUT2','OUT3'].map((t,i)=>({t,i,open:m['o'+(i+1)]!==false,wired:wires.some(w=>!w.broken&&((w.a.c===m.id&&w.a.t===t)||(w.b.c===m.id&&w.b.t===t)))})).filter(x=>x.open);
    const n=Math.max(1,act.filter(x=>x.wired).length),cap=feed>0?feed/n:INF;
    for(const x of act)mfEdges.push({m,t:x.t,i:x.i,e:addE('u'+R(m,'IN'),'d'+R(m,x.t),cap)});}
  const se=srcs.map(x=>{const i=addE('S','s'+x.c.id,INF);addE('s'+x.c.id,'u'+x.net,INF);return i;});
  const ke=sinks.map(k=>{const i=addE('d'+k.net,'k'+k.c.id,INF);addE('k'+k.c.id,'T',k.cap==null?INF:k.cap);return i;});
  for(let g=0;g<300;g++){
    const prev=new Array(N.size).fill(-1);prev[S]=-2;const q=[S];
    for(let qi=0;qi<q.length&&prev[T]===-1;qi++){for(const ei of adj[q[qi]]||[]){const e=E[ei];if(prev[e.v]===-1&&e.c-e.f>1e-9){prev[e.v]=ei;q.push(e.v);}}}
    if(prev[T]===-1)break;
    let b=INF;for(let v=T;v!==S;v=E[prev[v]].u)b=Math.min(b,E[prev[v]].c-E[prev[v]].f);
    for(let v=T;v!==S;v=E[prev[v]].u){E[prev[v]].f+=b;E[prev[v]^1].f-=b;}
  }
  let delivered=0;
  pumps.forEach((p,i)=>{p.flow=E[pe[i]].f;const sp=p.spin||0,P0=(2.5+3*p.hp)*(p.headK||1)*sp*sp,r=p.flow/Math.max(1e-6,p.hp*0.12*(p.flowK||1)*sp);p.head=P0*10.2;
    if(p.flow>0.0005){hflow.add(R(p,'SUC'));hflow.add(R(p,'DIS'));p.dryHeat=Math.max(0,p.dryHeat-dt*0.5);
      // Calculate pressure based on flow
      p.pressure=Math.max(0,P0*(1-r*r)); 
      // Update temperature
      p.temperature+=((20+7*p.hp*(1-Math.min(1,r)))-p.temperature)*Math.min(1,dt/60);}
    else{p.dryHeat+=dt;p.pressure=p._wet?P0:0;p.temperature+=((p._wet?20+45*Math.min(1,p.dryHeat/40):20+25*Math.min(1,p.dryHeat/30))-p.temperature)*Math.min(1,dt/25);
      warnings.push(`${p.label}: `+(p._wet?'water reaches suction, but no destination is reachable from DIS (pipe DIS to a Water Tank, Feedwater Tank IN/RETURN, Boiler WATER, Steam Generator/Condenser WATER_IN — check check-valve direction, closed valves, or a full destination)':'no water source reaches the suction port (connect Water Source OUT or a filled Tank OUT to pump SUC)'));
      if(p.dryHeat>10&&!p.cutout){p.cutout=true;log(`⚠ ${p.label} thermal cut-out: pump overheated running without flow`);}}});
  for(const cv of comps.filter(c=>(c.type==='checkvalve'||c.type==='poppetvalve'))){const ei=cvEdges.get(cv.id),f=ei==null?0:E[ei].f;cv.flow=Math.max(0,f);cv.open=cv.flow>0.01;if(cv.open){hflow.add(R(cv,'IN'));hflow.add(R(cv,'OUT'));}}
  srcs.forEach((x,i)=>{const f=E[se[i]].f;if(f>0.01)hflow.add(x.net);if(x.sump)x.c._use+=f;else x.c._out+=f;});
  sinks.forEach((k,i)=>{const f=E[ke[i]].f;if(f>0.00001)hflow.add(k.net);k.c._in=(k.c._in||0)+f;delivered+=f;if(!k.proc)k.c.pressure=Math.max(0.0294*(k.c.level||0), pumps.reduce((m,p)=>Math.max(m,p.pressure||0),0)); });
  for(const x of mfEdges){const f=E[x.e].f;x.m._outF[x.i]=f;if(f>0.0005){hflow.add(R(x.m,'IN'));hflow.add(R(x.m,x.t));}}

  // Tank-to-tank transfer is storage-mediated, head-driven gravity flow through the tank outlet restriction,
  // never an instantaneous pass-through. Follow only forward check-valve directions.
  const cvNext=new Map();
  for(const cv of comps.filter(c=>(c.type==='checkvalve'||c.type==='poppetvalve'))){
    const from=R(cv,'IN'),to=R(cv,'OUT');
    if(from!==to){if(!cvNext.has(from))cvNext.set(from,[]);cvNext.get(from).push(to);}
  }
  const canReach=(from,target)=>{
    if(from===target)return true;
    const seen=new Set([from]),queue=[from];
    for(let qi=0;qi<queue.length;qi++)for(const next of cvNext.get(queue[qi])||[]){
      if(next===target)return true;
      if(!seen.has(next)){seen.add(next);queue.push(next);}
    }
    return false;
  };
  const pumpSuctionNets=new Set(pumps.map(p=>R(p,'SUC')));
  for(const source of tanks){
    const from=R(source,'OUT');
    if(source.level<=0||pumpSuctionNets.has(from))continue;
    const destinations=tanks.filter(dest=>dest!==source&&dest.level<100&&canReach(from,R(dest,'IN')));
    if(!destinations.length)continue;
    // Flow is limited by gravity head and an intentionally conservative outlet capacity.
    // With equal liquid levels, no gravity transfer occurs; the pump must first raise TK1's level.
    for(const dest of destinations){
      const head=Math.max(0,(source.level-dest.level)/100);
      if(head<=0)continue;
      const outletOpening=Math.max(0,Math.min(100,Number(source.outletRestriction??30)))/100;
      // A tank is a storage vessel, not a zero-volume pipe junction. Its outlet has a configurable restriction.
      // The square-root head relationship slows transfer at small level differences; the outlet setting
      // represents pipe/valve resistance and prevents the receiving tank from draining instantaneously.
      const q=(0.12*Math.pow(outletOpening,1.5)*Math.sqrt(head))/destinations.length; // tank-level percentage points per second
      const safeQ=Math.min(q,source.level/Math.max(dt,1e-6),(100-dest.level)/Math.max(dt,1e-6));
      if(safeQ<=0)continue;
      source._out+=safeQ;dest._in+=safeQ;
      hflow.add(from);hflow.add(R(dest,'IN'));
      const cv=comps.find(v=>v.type==='checkvalve'&&canReach(from,R(v,'IN'))&&canReach(R(v,'OUT'),R(dest,'IN')));
      if(cv){cv.flow=safeQ;cv.open=true;hflow.add(R(cv,'IN'));hflow.add(R(cv,'OUT'));}
    }
  }
  return delivered;
}
function updateTimer(c, energized, dt){
  const oldOutput=!!c.output, oldCoil=!!c.coilOn;
  c.coilOn=!!energized;
  const delay=Math.max(0,Number(c.delay)||0);
  if(c.mode==='on-delay'){
    if(c.coilOn){c.elapsed=Math.min(delay,c.elapsed+dt);c.output=c.elapsed>=delay;}
    else{c.elapsed=0;c.output=false;}
  }else if(c.mode==='off-delay'){
    if(c.coilOn){c.elapsed=0;c.output=true;}
    else if(c.output){c.elapsed=Math.min(delay,c.elapsed+dt);if(c.elapsed>=delay)c.output=false;}
    else c.elapsed=0;
  }else if(c.mode==='interval'){
    if(!c.coilOn){c.elapsed=0;c.output=false;}
    else{c.elapsed=Math.min(delay,c.elapsed+dt);c.output=c.elapsed<delay;}
  }
  c.remaining=Math.max(0,delay-c.elapsed);
  if(c.coilOn!==oldCoil)log(`${c.label} coil ${c.coilOn?'energised':'de-energised'}`);
  if(c.output!==oldOutput)log(`${c.label} timed output ${c.output?'ON':'OFF'} (${c.mode})`);
  return c.output!==oldOutput;
}
function step(dt){
  for(const c of comps)if(c.type==='ats')c._dt=dt||0;
  for(const c of comps)if(c.type==='valve'&&c.flowPercent==null)c.flowPercent=25;
  const tanks=comps.filter(c=>c.type==='tank'||c.type==='feedwatertank'||c.type==='silo'||c.type==='silopump'); // water storage vessels (pump source/destination)
  for(const c of comps)if(c.type==='float'){
    if(c.mode==='up')c.up=true;else if(c.mode==='down')c.up=false;
    else if(tanks.length){const t=nearest(c,tanks);if(t.level>=c.stop)c.up=true;else if(t.level<=c.restart)c.up=false;}
  }

  // Solar power generation — realistic irradiance + temperature model
  for(const c of comps)if(c.type==='solar'){
    const baseSun=Math.max(0,Math.min(100,Number(c.sunIntensity)||80))/100; // 0–1 user setpoint
    const cloud=Math.max(0,Math.min(0.8,Number(c.cloudiness)||0.15));
    // Slow cloud / irradiance variation
    const t=performance.now()*0.001;
    const phase=(c.id||1)*2.3;
    const cloudWave=Math.sin(t*0.18+phase)*0.55+Math.sin(t*0.47+phase*0.8)*0.3+Math.sin(t*1.1)*0.15;
    const instIrrFactor=Math.max(0,Math.min(1.15, baseSun*(1-cloud*0.7)+cloud*0.35*cloudWave));
    const G=instIrrFactor*1000; // W/m² effective irradiance
    c._irradiance=G;

    const area=Math.max(0.1,Number(c.area)||2);
    const eta=Math.max(0.05,Math.min(0.28,Number(c.efficiency)||0.2));
    const tilt=Math.max(0,Math.min(90,Number(c.tilt)||30));
    // Simple tilt / incidence factor (optimal ~ latitude, here fixed mild penalty)
    const tiltFactor=0.75+0.25*Math.cos((tilt-30)*Math.PI/180);
    const soiling=Math.max(0,Math.min(0.5,Number(c.soiling)||0));
    const ambient=Number(c.ambient)!=null?Number(c.ambient):25;
    // NOCT-style cell temperature: rises with irradiance
    const cellTemp=ambient+(G/800)*28;
    c._cellTemp=cellTemp;
    const tempCoeff=Number(c.tempCoeff)!=null?Number(c.tempCoeff):-0.004; // %/°C typical for c-Si
    const tempFactor=1+tempCoeff*(cellTemp-25);
    const rated=Math.max(0,Number(c.watts)||0);

    let P=0,status='IDLE';
    if(c.fault==='open'){status='OPEN CIRCUIT';}
    else if(c.fault==='short'){status='SHORT';P=0;}
    else if(G<20){status='NIGHT / DARK';}
    else{
      // Physical model
      const physical=area*G*eta*tiltFactor*(1-soiling)*Math.max(0.2,tempFactor);
      // Also respect nameplate STC scaling
      const stcScale=rated*(G/1000)*Math.max(0.2,tempFactor)*(1-soiling)*tiltFactor;
      P=Math.max(physical,stcScale*0.85); // blend; physical preferred when area set
      if(rated>0)P=Math.min(P,rated*1.05); // soft ceiling slightly above nameplate
      status=G>700?'FULL SUN':G>300?'PARTIAL':'LOW LIGHT';
      if(cellTemp>65)status+=' · HOT';
    }
    c.outputPower=Math.max(0,P);
    const vBus=Math.max(12,Number(c.voltage)||30);
    c.current=c.outputPower/vBus;
    c.status=status;
  }

  // Wind turbine power generation — realistic curve + dynamic wind
  for(const c of comps)if(c.type==='wind'){
    const mean=Math.max(0,Number(c.windSpeed)||0);
    const turb=Math.max(0,Math.min(0.6,Number(c.turbulence)||0.15));
    const t=performance.now()*0.001;
    const phase=(c.id||1)*1.7;
    const gust=Math.sin(t*0.55+phase)*0.55+Math.sin(t*1.35+phase*0.7)*0.28+Math.sin(t*2.9+phase*1.3)*0.12;
    c._gust=c._gust==null?0:c._gust*0.92+gust*0.08;
    const inst=Math.max(0,mean*(1+turb*c._gust));
    c._instWind=inst;

    const cutIn=Math.max(0.5,Number(c.cutIn)||3.5);
    const ratedV=Math.max(cutIn+0.5,Number(c.ratedSpeed)||12);
    const cutOut=Math.max(ratedV+1,Number(c.cutOut)||25);
    const rho=Math.max(0.8,Number(c.airDensity)||1.225);
    const diam=Math.max(0.5,Number(c.rotorDiameter)||3);
    const area=Math.PI*(diam*0.5)**2;
    const Cp=Math.max(0.05,Math.min(0.45,Number(c.efficiency)||0.35));
    const ratedP=Math.max(50,Number(c.power)||500);
    const vBus=Math.max(6,Number(c.voltage)||24);

    let P=0,status='IDLE';
    if(c.fault==='blade'){status='BLADE FAULT';}
    else if(c.fault==='gen'){status='GEN FAULT';}
    else if(inst<cutIn){status='BELOW CUT-IN';}
    else if(inst>=cutOut){status='CUT-OUT';}
    else{
      const aero=0.5*rho*area*inst**3*Cp;
      if(inst<=ratedV){
        const x=Math.max(0,(inst-cutIn)/(ratedV-cutIn));
        P=Math.min(ratedP,aero*Math.pow(x,0.15));
        const blend=Math.pow(x,2);
        P=P*(1-blend)+Math.min(ratedP,aero)*blend;
        status=inst<ratedV*0.85?'RUN-UP':'RATED REGION';
      }else{
        P=ratedP;
        status='PITCHED / RATED';
      }
      if(inst>cutOut-3){
        const d=(cutOut-inst)/3;
        P*=Math.max(0,d);
        if(d<0.4)status='NEAR CUT-OUT';
      }
    }
    c.outputPower=Math.max(0,P);
    c.current=c.outputPower/vBus;
    c.status=status;

    const tsr=7;
    const tipSpeed=inst*tsr;
    const omega=diam>0?(2*tipSpeed/diam):0;
    const targetRpm=(omega*60)/(2*Math.PI);
    c.rpm=c.rpm==null?0:c.rpm;
    const rpmRate=c.fault==='blade'?0.4:2.5;
    c.rpm+=(targetRpm-c.rpm)*Math.min(1,dt*rpmRate);
    if(inst<cutIn||c.fault==='blade'||inst>=cutOut)c.rpm*=Math.max(0,1-dt*1.2);
    if(c.rpm<1)c.rpm=0;
  }

  // Generator power
  for(const c of comps)if(c.type==='generator'){
    if(c.on&&c.fuel>0){
      c.fuel=Math.max(0,c.fuel-c.fuelRate*dt);
      c.outputPower=c._P>0?c._P:c.kva*1000;
    }else{
      c.outputPower=0;
    }
  }

  // AC-to-DC battery charger: isolated output, current-limited charge, and adjustable efficiency.
  const chargerCircuit=evalCircuit();
  for(const ch of comps.filter(x=>x.type==='batterycharger')){
    const acLive=!!ch.on&&live(chargerCircuit,ch,'AC_L','AC_N');
    ch.outputCurrent=0;ch.inputCurrent=0;ch.status=acLive?'READY':(ch.on?'NO AC INPUT':'OFFLINE');
    if(acLive){
      const dcPlus=chargerCircuit.uf.find(key(ch.id,'DC+')),dcMinus=chargerCircuit.uf.find(key(ch.id,'DC-'));
      const bat=findPack(chargerCircuit.uf,dcPlus,dcMinus);
      if(bat&&Number(bat.soc)<100){
        const vbat=Math.max(1,bankV(bat)||Number(bat.voltage)||12),vout=Math.max(0,Number(ch.dcVoltage)||0);
        const taper=Math.max(0,Math.min(1,(100-Number(bat.soc))/15));
        const limit=Math.max(0,Number(ch.currentLimit)||0);
        const i=Math.min(limit,Math.max(0,(vout-vbat)*2),limit*taper);
        ch.outputCurrent=i;ch.inputCurrent=(vout*i)/Math.max(1,Number(ch.acVoltage)||230)/Math.max(0.1,Number(ch.efficiency)||0.9);
        ch.status=i>0.02?'CHARGING':'READY';bat.charging=i>0.02;bat.discharging=false;
        if(i>0.02&&dt>0)bat.soc=Math.min(100,bat.soc+(i/packAh(bat))*100*dt/3600);
      }else if(bat){bat.charging=false;ch.status='BATTERY FULL';}
    }
    // If this charger's output is wired to a battery but AC is absent or the charger is disabled, stop charging.
    for(const bat2 of comps.filter(isPack)){
      const bp=chargerCircuit.uf.find(key(bat2.id,'IN+')),bn=chargerCircuit.uf.find(key(bat2.id,'IN-'));
      if(bp===chargerCircuit.uf.find(key(ch.id,'DC+'))&&bn===chargerCircuit.uf.find(key(ch.id,'DC-'))&&!acLive)bat2.charging=false;
    }
  }
  // Battery charging/discharging: no AC input means no charger-driven SOC increase.
  for(const c of comps)if(isPack(c)){
    if(bankOf(c).top!==c)continue; // series bank: the top pack integrates, the others follow (see series sync)
    const activeCharger=comps.some(ch=>ch.type==='batterycharger'&&ch.status==='CHARGING'&&ch.outputCurrent>0);
    if(!activeCharger&&!(c._srcW>0))c.charging=false;
    const capAh=packAh(c),vb=Math.max(8,bankV(c)),k=100*dt/3600*120/capAh;
    const maxDsg=c.type==='lfpbattery'?capAh*Math.max(.05,Number(c.dischargeC)||1)*vb:1e9;
    if(c.discharging){
      const net=Math.min(maxDsg,Math.max(0,(c._loadW||0)-(c._srcW||0)));
      c._packI=net/vb;
      c.soc=Math.max(0,c.soc-(net/vb)*k);
      if(c.soc<=0)c.discharging=false;
    }else if(c.charging&&c._direct){
      const net=Math.max(0,(c._srcW||0)-(c._loadW||0));
      const maxChg=c.type==='lfpbattery'?capAh*Math.max(.05,Number(c.chargeC)||.5)*vb:1e9;
      const use=Math.min(maxChg,net);
      c._packI=-use/vb;
      c.soc=Math.min(100,c.soc+(use*0.95/vb)*k);
    }else c._packI=0;
    if(c.type==='lfpbattery'){
      c.capacity=capAh;c.nomVoltage=bankNomV(c);c.voltage=bankV(c);
      const amb=Number(c.ambient)||25,heat=Math.min(30,Math.abs(c._packI||0)*Math.abs(c._packI||0)*(Number(c.cellRi)||2)/1000*8);
      c.temperature=(Number(c.temperature)||amb)+(amb+heat-(Number(c.temperature)||amb))*Math.min(1,dt*0.4);
    }else c.voltage=12+(c.soc/100)*2;
  }

  // Supercapacitor
  for(const c of comps)if(c.type==='supercap'){
    if(c.charging){
      c.soc=Math.min(100,c.soc+dt*2);
      if(c.soc>=100)c.charging=false;
    }
    if(c.discharging){
      c.soc=Math.max(0,c.soc-dt*5);
      if(c.soc<=0)c.discharging=false;
    }
    c.voltage=c.soc/100*c.farads;
  }

  // Heater temperature
  for(const c of comps)if(c.type==='heater'){
    if(c.powered){
      c.temperature=Math.min(100,c.temperature+dt*2);
    }else{
      c.temperature=Math.max(20,c.temperature-dt*0.5);
    }
  }

  // Fan speed
  for(const c of comps)if(c.type==='fan'){
    if(c.powered){
      c.speed=Math.min(100,c.speed+dt*10);
    }else{
      c.speed=Math.max(0,c.speed-dt*5);
    }
  }

  // LED brightness
  for(const c of comps)if(c.type==='ledstrip'){
    if(c.powered){
      c.brightness=Math.min(100,c.brightness+dt*20);
    }else{
      c.brightness=Math.max(0,c.brightness-dt*10);
    }
  }

  // Solenoid valve
  for(const c of comps)if(c.type==='solenoid'){
    c.open=c.powered;
  }

  // VFD simulation
  for(const c of comps)if(c.type==='vfd'){
    if(c.on){
      c.rpm=1440*(c.hz/50);
      c.torque=100;
    }else{
      c.rpm=0;
      c.torque=0;
    }
  }

  // PID controller
  for(const c of comps)if(c.type==='pid'){
    if(c.mode==='auto'){
      const error=c.setpoint-c.pv;
      c.output=c.kp*error;
      c.output=Math.max(0,Math.min(100,c.output));
    }
  }

  // Energy meter values are derived after circuit solving by the instrumentation refinement below.
  // Gas turbine simulation
  for(const c of comps)if(c.type==='gasturbine'&&c.on){
    if(c.fuel>0){
      c.fuel=Math.max(0,c.fuel-c.fuelRate*dt);
      c.outputPower=c._P>0?c._P:c.mw*1000000*c.efficiency;
      c.temperature=Math.min(800,c.temperature+dt*0.5);
    }else{
      c.outputPower=0;
    }
  }
  // Steam turbine simulation
  for(const c of comps)if(c.type==='steamturbine'&&c.on){
    c.outputPower=c._P>0?c._P:c.mw*1000000;
    c.rpm=3000;
  }
  // Boiler simulation
  for(const c of comps)if(c.type==='boiler'&&c.on){
    c.temperature=Math.min(400,c.temperature+dt*2);
    c.pressure=Math.min(200,c.pressure+dt*0.5);
  }
  // Cooling tower
  for(const c of comps)if(c.type==='coolingtower'){
    c.fanSpeed=Math.min(100,c.fanSpeed+dt*10);
  }

  let st=evalCircuit();
  // Update timer relays from their actual A1/A2 supply, then rebuild electrical paths if contacts changed.
  let timerContactsChanged=false;
  for(const tm of comps)if(tm.type==='timer')timerContactsChanged=updateTimer(tm,live(st,tm,'A1','A2'),dt)||timerContactsChanged;
  if(timerContactsChanged)st=evalCircuit();
  if(st.cl.short){handleShort();st=evalCircuit();}
  const dead=st.cl.short;sim.short=dead;
  if(dead)for(const c of comps)if(c.type==='contactor')c.coilOn=false;
  const src=comps.find(c=>c.type==='source'&&c.on);sim.volts=src?src.volts:0;
  if(!sim.volts){const hy=comps.find(h=>isHyb(h)&&h.on&&h._out!==false&&(h._src==='INV'||h.mode==='BATTERY'||h.mode==='SOLAR'||h.mode==='STANDBY'||h.mode==='SOLAR + BATTERY'||h.mode==='INVERTING'));if(hy)sim.volts=230;}
  if(!sim.volts){const iv=comps.find(i=>i.type==='inverter'&&i.on&&i._out!==false&&!i._bypass);if(iv)sim.volts=230;}
  if(!sim.volts){const s3=comps.find(c=>c.type==='source3'&&c.on);if(s3)sim.volts=num(s3.volts,400)/Math.sqrt(3);}
  const V=src?src.volts:220;
  let totalI=0,motorI=0,power=0,pumpRate=0;const flow=new Set(),hazards=[],warnings=[],pumps=[];
  const addFlow=(c,a,b)=>{flow.add(st.uf.find(key(c.id,a)));flow.add(st.uf.find(key(c.id,b)));};
  for(const c of comps){
    if(c.type==='motor'){
      const was=c.powered;if(!c.pump)c.dryHeat=0;const p=!dead&&live(st,c,'L','N')&&c.fault!=='open'&&!c.cutout;c.powered=p;
      c.spin=(c.spin||0)+((p?1:0)-(c.spin||0))*Math.min(1,dt/(p?.9:2.5));if(p){if(!was)c.startT=0;c.startT+=dt;
        const pin=c.hp*746/c.eff,run=pin/(V*c.pf);c.I=(c.fault==='stall'||c.startT<1.5)?run*c.inrush:run;
        totalI+=c.I;motorI+=c.I;power+=pin;addFlow(c,'L','N');if(c.pump)pumps.push(c);
        if(ntype(st,c,'PE')!=='PE')warnings.push(`${c.label}: frame not earthed`);
        if(c.fault==='earth')earthFault(c,st,hazards);
      }else{c.I=0;c.startT=0;c.dryHeat=Math.max(0,c.dryHeat-dt*0.5);}
      flag('m'+c.id,p,`${c.label} started`,`${c.label} stopped`);
    }else if(c.type==='gearpump'){
      const was=c.powered;if(!c.pump)c.dryHeat=0;
      // Dual drive: shaft-driven machines report L/N as live through the shaft
      // wrapper, so test the real terminal nets with ntype to tell the modes apart.
      const lt=ntype(st,c,'L'),nt=ntype(st,c,'N');
      const elec=(lt==='L'&&nt==='N')||(lt==='N'&&nt==='L');
      const shaft=!!c._shaftRun&&!elec;
      const p=!dead&&(elec||shaft)&&c.fault!=='open'&&!c.cutout;c.powered=p;
      c.drive=shaft?'shaft':elec?'motor':'none';
      c.spin=(c.spin||0)+((p?1:0)-(c.spin||0))*Math.min(1,dt/(p?.9:2.5));if(p){if(!was)c.startT=0;c.startT+=dt;
        if(elec){const pin=c.hp*746/c.eff,run=pin/(V*c.pf);c.I=(c.fault==='stall'||c.startT<1.5)?run*c.inrush:run;
          totalI+=c.I;motorI+=c.I;power+=pin;addFlow(c,'L','N');
          if(ntype(st,c,'PE')!=='PE')warnings.push(`${c.label}: frame not earthed`);
          if(c.fault==='earth')earthFault(c,st,hazards);}
        else c.I=0;
        c.rpm=Math.round(c.spin*1450);pumps.push(c);
      }else{c.I=0;c.startT=0;c.rpm=0;c.dryHeat=Math.max(0,c.dryHeat-dt*0.5);}
      flag('m'+c.id,p,`${c.label} started`,`${c.label} stopped`);
    }else if(c.type==='silopump'){
      const was=c.powered;if(!c.pump)c.dryHeat=0;
      const p=!dead&&live(st,c,'L','N')&&c.fault!=='open'&&!c.cutout;c.powered=p;
      c.spin=(c.spin||0)+((p?1:0)-(c.spin||0))*Math.min(1,dt/(p?.9:2.5));if(p){if(!was)c.startT=0;c.startT+=dt;
        const pin=c.hp*746/c.eff,run=pin/(V*c.pf);c.I=(c.fault==='stall'||c.startT<1.5)?run*c.inrush:run;
        totalI+=c.I;motorI+=c.I;power+=pin;addFlow(c,'L','N');c.rpm=Math.round(c.spin*1450);pumps.push(c);
        if(ntype(st,c,'PE')!=='PE')warnings.push(`${c.label}: frame not earthed`);
        if(c.fault==='earth')earthFault(c,st,hazards);
      }else{c.I=0;c.startT=0;c.rpm=0;c.dryHeat=Math.max(0,c.dryHeat-dt*0.5);}
      flag('m'+c.id,p,`${c.label} pump started`,`${c.label} pump stopped`);
    }else if(c.type==='timer'&&c.coilOn){totalI+=0.02;power+=2;addFlow(c,'A1','A2');}
    else if(c.type==='lamp'){
      const p=!dead&&live(st,c,'a','b')&&c.fault!=='open';c.powered=p;c.I=p?c.watts/V:0;
      if(p){totalI+=c.I;power+=c.watts;addFlow(c,'a','b');if(c.fault==='earth')earthFault(c,st,hazards);}
    }else if(c.type==='contactor'&&c.coilOn){totalI+=0.03;power+=7;addFlow(c,'A1','A2');
    }else if(c.type==='solar'&&live(st,c,'+','-')){
      const solarPower=c.outputPower||0;
      const vBus=Math.max(12,Number(c.voltage)||30);
      totalI+=solarPower/vBus;
      power+=solarPower;
      addFlow(c,'+','-');
    }else if(isPack(c)){
      // Net-power model: sources (solar, wind, DC supply, charger, inverter-charger) are never loads.
      const _nt=bankNets(st.uf,bankOf(c)),bp=_nt.p,bn=_nt.n;
      const onNet=(o,ts)=>ts.some(t=>st.uf.find(key(o.id,t))===bp)&&ts.some(t=>st.uf.find(key(o.id,t))===bn);
      const SRC=new Set(['hybrid','hybridlfp','hybridlfpgt','hybridbms','solar','wind','dcsource','chargecontroller','batterycharger','supercap','generator','battery','lfpbattery','bms','dcbreaker','acbreaker','source','source3','inverter','acvawmeter','dcvawmeter']);
      const nz=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
      let srcW=0,loadW=0,direct=true,anySrc=false;
      for(const o of comps){
        if(o.id===c.id)continue;
        const ts=(DEFS[o.type]?.term||[]).map(t=>t[0]);
        if(!ts.length)continue;
        if(o.type==='solar'||o.type==='wind'){if(onNet(o,['+','-'])){srcW+=nz(o.outputPower,0);anySrc=true;}}
        else if(o.type==='dcsource'){if(o.on&&onNet(o,['+','-'])){srcW+=nz(o.volts,0)*nz(o.current,0);anySrc=true;}}
        else if(o.type==='chargecontroller'){if(o.on&&(onNet(o,['BAT+','BAT-'])||onNet(o,['PV+','PV-']))){direct=false;anySrc=true;}}
        else if(o.type==='batterycharger'){if(onNet(o,['DC+','DC-'])){direct=false;if(o.on&&o.status==='CHARGING'){srcW+=nz(o.outputCurrent,0)*nz(c.voltage,12);anySrc=true;}}}
        else if(o.type==='inverter'||isHyb(o)){if(onNet(o,isHyb(o)?['BAT+','BAT-']:['DC+','DC-'])){if(o._chgW>0){direct=false;srcW+=o._chgW;anySrc=true;}loadW+=nz(o._dcW,0);}}
        else if(o.type==='bms'){if(onNet(o,['PACK+','PACK-'])||onNet(o,['P+','P-'])){direct=false;anySrc=true;}}
        else if(!SRC.has(o.type)&&onNet(o,ts.slice(0,2))){
          if(o.powered)loadW+=nz(o.watts,0)||(nz(o.I,0)*nz(c.voltage,12))||20;
        }
      }
      c._srcW=srcW;c._loadW=loadW;c._direct=direct&&anySrc;
      if(anySrc&&srcW>=loadW){c.charging=true;c.discharging=false;}
      else if(loadW>srcW){c.discharging=true;c.charging=false;}
      else{c.discharging=false;if(!anySrc)c.charging=false;}
      if(c.soc<=0){c.discharging=false;}
      if(c.charging||c.discharging)addFlow(c,'OUT+','OUT-');
    }else if(c.type==='inverter'&&c.on){
      if(c._out!==false&&c._out!=='x'&&(c._dcW>0||c._bypass||c._chgW>0)){
        if(c._bypass)addFlow(c,'IN_L','IN_N');
        else{addFlow(c,'DC+','DC-');addFlow(c,'AC_L','AC_N');}
        if(c._chgW>0)addFlow(c,'DC+','DC-');
      }
    }else if(isHyb(c)&&c.on){
      if(c.pvW>0)addFlow(c,'PV+','PV-');
      if(c._chgW>0||c._dcW>0)addFlow(c,'BAT+','BAT-');
      if(c._out!==false&&c._src==='GRID')addFlow(c,'GRID_L','GRID_N');
      if(c._out!==false&&c._src==='GEN'&&c.type!=='hybridlfpgt')addFlow(c,'GEN_L','GEN_N');
      if(c._out!==false&&(c._src==='INV'||c._bypass))addFlow(c,'OUT_L','OUT_N');
    }else if(c.type==='bms'&&c.on&&(c.dsgOk||c.chgOk)){
      addFlow(c,'PACK+','PACK-');
      if(c.dsgOk)addFlow(c,'P+','P-');
      if(c.chgOk)addFlow(c,'C+','C-');
    }else if(c.type==='chargecontroller'&&c.on){
      // Charge controller manages battery charging
      if(live(st,c,'PV+','PV-')&&live(st,c,'BAT+','BAT-')){
        const solar=comps.find(s=>s.type==='solar');
        const battery=comps.find(isPack);
        if(solar&&battery){
          battery.charging=true;
          battery.discharging=false;
          const chargePower=solar.outputPower*0.95; // Controller efficiency
          power+=chargePower;
          addFlow(c,'PV+','PV-');
          addFlow(c,'BAT+','BAT-');
        }
      }
    }else if(c.type==='dcsource'&&c.on&&live(st,c,'+','-')){
      const dcPower=c.volts*c.current;
      totalI+=c.current;
      power+=dcPower;
      addFlow(c,'+','-');
    }else if(c.type==='generator'&&c.on&&live(st,c,'L','N')){
      const genPower=c.outputPower||0;
      totalI+=genPower/230;
      power+=genPower;
      addFlow(c,'L','N');
    }else if(c.type==='wind'&&live(st,c,'+','-')){
      const windPower=c.outputPower||0;
      const vBus=Math.max(6,Number(c.voltage)||24);
      totalI+=windPower/vBus;
      power+=windPower;
      addFlow(c,'+','-');
    }else if(c.type==='heater'&&live(st,c,'L','N')){
      c.powered=true;
      totalI+=c.watts/V;
      power+=c.watts;
      addFlow(c,'L','N');
    }else if(c.type==='fan'&&live(st,c,'L','N')){
      c.powered=true;
      totalI+=c.watts/V;
      power+=c.watts;
      addFlow(c,'L','N');
    }else if(c.type==='ledstrip'&&live(st,c,'+','-')){
      c.powered=true;
      totalI+=c.watts/24;
      power+=c.watts;
      addFlow(c,'+','-');
    }else if(c.type==='solenoid'&&live(st,c,'+','-')){
      c.powered=true;
      totalI+=c.watts/24;
      power+=c.watts;
      addFlow(c,'+','-');
    }else if(c.type==='vfd'&&c.on&&live(st,c,'L1','L2')&&live(st,c,'L2','L3')){
      const vfdPower=c.amps*230*Math.sqrt(3)*c.pf||0;
      totalI+=c.amps*3;
      power+=vfdPower;
      addFlow(c,'L1','L2');addFlow(c,'L2','L3');
    }else if(c.type==='softstart'&&c.on&&live(st,c,'L1','L2')&&live(st,c,'L2','L3')){
      const ssPower=c.currentLimit*230/100*1000||0;
      totalI+=c.currentLimit;
      power+=ssPower;
      addFlow(c,'L1','L2');addFlow(c,'L2','L3');
    }else if(c.type==='relay'&&c.coilOn){
      totalI+=0.05;power+=3;addFlow(c,'A1','A2');
    }else if(c.type==='ssr'&&c.on){
      totalI+=0.02;power+=2;addFlow(c,'+','-');
    }else if(c.type==='energymeter'&&live(st,c,'L','N')){
      c.voltage=V;
      c.current=totalI;
    }else if(c.type==='ct'&&live(st,c,'P1','P2')){
      c.primary=totalI;
      c.secondary=c.primary*(5/(c.ratio*100));
    }else if(c.type==='vt'&&live(st,c,'P1','P2')){
      c.primary=V;
      c.secondary=c.primary*(100/(c.ratio*400));
    }
    if(c.type==='contactor')flag('k'+c.id,c.coilOn,`${c.label} coil energised – contacts closed`,`${c.label} coil de-energised – contacts open`);
  }
  // protective devices
  for(const c of comps){
    if(c.type==='mcb'&&c.closed&&!c.tripped){
      const r=totalI/c.rating;if(r>1)c.heat+=dt*(r*r-1)*0.5;else c.heat=Math.max(0,c.heat-dt*0.3);
      if(r>8||c.heat>3){c.tripped=true;c.heat=0;log(`⚠ ${c.label} tripped: overcurrent (${totalI.toFixed(1)} A)`);}
    }
    if(c.type==='rcd'&&c.closed&&!c.tripped){
      const leakage=comps.some(x=>['motor','lamp','heater','fan','ledstrip','solenoid'].includes(x.type)&&x.fault==='earth'&&x.powered);
      c.leakageMa=leakage?Math.max(c.ma,30):0;
      if(c.leakageMa>=c.ma){c.tripped=true;log(`⚠ ${c.label} tripped: simulated earth leakage (${c.leakageMa.toFixed(0)} mA)`);}
    }
    if(c.type==='overload'&&!c.tripped){
      const r=motorI/c.setting;if(r>1)c.heat+=dt*(r*r-1)*0.5;else c.heat=Math.max(0,c.heat-dt*0.3);
      if(c.heat>3){c.tripped=true;c.heat=0;log(`⚠ ${c.label} thermal overload tripped (${motorI.toFixed(1)} A)`);}
    }
    if(c.type==='fuse'&&!c.blown){
      const r=totalI/Math.max(0.1,Number(c.rating)||10);
      c.heat=Number(c.heat)||0;
      if(r>1)c.heat+=dt*(r*r-1)*0.35;else c.heat=Math.max(0,c.heat-dt*0.2);
      if(r>10||c.heat>4){c.blown=true;c.heat=0;log(`⚠ ${c.label} blown: overcurrent (${totalI.toFixed(1)} A)`);}
    }
    if(c.type==='overcurrentrelay'&&!c.tripped){
      const pickup=Math.max(0.1,Number(c.setting)||1.5);
      c.elapsedOvercurrent=totalI>pickup?(Number(c.elapsedOvercurrent)||0)+dt:0;
      if(totalI>pickup*8||c.elapsedOvercurrent>=Math.max(0.05,Number(c.timeDelay)||0.5)){c.tripped=true;c.elapsedOvercurrent=0;log(`⚠ ${c.label} tripped: overcurrent (${totalI.toFixed(1)} A)`);}
    }
    if(c.type==='differentialrelay'&&!c.tripped){
      const earthFault=comps.some(x=>['motor','lamp','heater','fan','ledstrip','solenoid'].includes(x.type)&&x.fault==='earth'&&x.powered);
      c.measuredDiff=earthFault?Math.max(Number(c.setting)||0.2,0.3):0;
      if(c.measuredDiff>=Math.max(0.01,Number(c.setting)||0.2)){c.tripped=true;log(`⚠ ${c.label} tripped: differential fault detected`);}
    }
  }
  // hydraulics
  const hu=buildHUF(),hflow=new Set(),sumps=comps.filter(c=>c.type==='sump');
  for(const t of tanks){t._in=0;t._out=0;t.pressure=0;}for(const sp of sumps)sp._use=0;for(const b of comps)if(b.type==='boiler')b._in=0;
  for(const c of comps)if(c.type==='motor'||c.type==='gearpump'||c.type==='silopump')c.flow=0;
  pumpRate=solveHydraulics(hu,pumps,sumps,tanks,hflow,warnings,dt);
  for(const b of comps)if(b.type==='boiler'&&b._in>0)b.waterLevel=Math.min(100,(Number(b.waterLevel)||0)+b._in*dt); // pumped feedwater raises drum level

  // Update gauges and instruments - enhanced for water, steam, and gas compatibility
  for(const c of comps){
    if(c.type==='gauge'){
      const r=hu.find(key(c.id,'IN'));
      if(r){
        const p=comps.find(p=>(p.type==='motor'||p.type==='gearpump'||p.type==='silopump')&&hu.find(key(p.id,'DIS'))===r);
        const t=tanks.find(t=>hu.find(key(t.id,'OUT'))===r);
        const gt=comps.find(p=>p.type==='gasturbine'&&hu.find(key(p.id,'GAS_IN'))===r);
        const st=comps.find(p=>p.type==='steamturbine'&&hu.find(key(p.id,'STEAM_IN'))===r);
        const bo=comps.find(p=>p.type==='boiler'&&hu.find(key(p.id,'STEAM'))===r);
        const gc=comps.find(p=>(p.type==='gascompressor'||p.type==='gasboosterpump')&&hu.find(key(p.id,'OUT'))===r);
        const gr=comps.find(p=>p.type==='pressureregulator'&&hu.find(key(p.id,'OUT'))===r);
        const gtank=comps.find(p=>p.type==='gastank'&&hu.find(key(p.id,'OUT'))===r);
        const lpg=comps.find(p=>p.type==='lpgtank'&&hu.find(key(p.id,'OUT'))===r);
        const natgas=comps.find(p=>p.type==='naturalgas'&&hu.find(key(p.id,'OUT'))===r);
        
        // Determine fluid type based on connected components
        if(c.service==='auto'){
          if(st||bo)c.fluid='steam';
          else if(gt||gc||gr||gtank||lpg||natgas)c.fluid='gas';
          else c.fluid='water';
        }
        
        // Get pressure based on fluid type
        if(c.fluid==='steam'){
          c.pressure=st?st.pressure:bo?bo.pressure:0;
        }else if(c.fluid==='gas'){
          c.pressure=gt?gt.pressure:gc?gc.pressure:gr?gr.output:gtank?gtank.pressure:natgas?natgas.pressure:0;
        }else{
          c.pressure=p?p.pressure:t?0.003*t.level:0;
        }
      }
    }
    if(c.type==='flowmeter'){
      const rIn=hu.find(key(c.id,'IN')),rOut=hu.find(key(c.id,'OUT'));
      if(rIn&&rOut){
        const pump=comps.find(p=>(p.type==='motor'||p.type==='gearpump'||p.type==='silopump')&&hu.find(key(p.id,'DIS'))===rIn);
        const gc=comps.find(p=>(p.type==='gascompressor'||p.type==='gasboosterpump')&&hu.find(key(p.id,'OUT'))===rIn);
        const gt=comps.find(p=>p.type==='gasturbine'&&hu.find(key(p.id,'EXHAUST'))===rIn);
        const bo=comps.find(p=>p.type==='boiler'&&hu.find(key(p.id,'STEAM'))===rIn);
        
        // Determine fluid type
        if(c.service==='auto'){
          if(bo)c.fluid='steam';
          else if(gc||gt)c.fluid='gas';
          else c.fluid='water';
        }
        
        // Get flow based on fluid type
        if(c.fluid==='water'){
          c.flow=pump?pump.flow*600:0;
          c.unit='L/min';
        }else if(c.fluid==='gas'){
          c.flow=gc?gc.flow:gt?gt.fuel/100:0;
          c.unit='m³/h';
        }else if(c.fluid==='steam'){
          c.flow=bo?bo.fuelRate:0;
          c.unit='kg/h';
        }
        c.total+=c.flow/60*dt;
      }
    }
    if(c.type==='tempgauge'){
      const r=hu.find(key(c.id,'IN'));
      if(r){
        const pump=comps.find(p=>(p.type==='motor'||p.type==='gearpump'||p.type==='silopump')&&hu.find(key(p.id,'DIS'))===r);
        const bo=comps.find(p=>p.type==='boiler'&&hu.find(key(p.id,'STEAM'))===r);
        const st=comps.find(p=>p.type==='steamturbine'&&hu.find(key(p.id,'STEAM_IN'))===r);
        const gt=comps.find(p=>p.type==='gasturbine'&&hu.find(key(p.id,'EXHAUST'))===r);
        
        // Determine fluid type
        if(c.service==='auto'){
          if(bo||st)c.fluid='steam';
          else if(gt)c.fluid='gas';
          else c.fluid='water';
        }
        
        // Get temperature based on fluid type
        if(c.fluid==='steam'){
          c.temperature=bo?bo.temperature:st?st.temperature:20;
        }else if(c.fluid==='gas'){
          c.temperature=gt?gt.temperature:20;
        }else{
          c.temperature=pump?pump.temperature:20;
        }
      }
    }
    if((c.type==='checkvalve'||c.type==='poppetvalve')){
      c.open=(c.flow||0)>0.00001;
    }
    // Enhanced level gauge - compatible with water, steam, and gas vessels
    if(c.type==='levelgauge'){
      const r=hu.find(key(c.id,'IN'));
      if(r){
        const t=tanks.find(t=>hu.find(key(t.id,'IN'))===r);
        const gt=comps.find(p=>p.type==='gastank'&&hu.find(key(p.id,'IN'))===r);
        const lpg=comps.find(p=>p.type==='lpgtank'&&hu.find(key(p.id,'IN'))===r);
        const fwt=comps.find(p=>p.type==='feedwatertank'&&hu.find(key(p.id,'IN'))===r);
        
        // Determine fluid type
        if(c.service==='auto'){
          if(gt||lpg)c.fluid='gas';
          else if(fwt)c.fluid='water';
          else c.fluid='water';
        }
        
        // Get level based on fluid type
        if(c.fluid==='gas'){
          c.level=gt?gt.level:lpg?lpg.level:0;
        }else{
          c.level=t?t.level:fwt?fwt.level:0;
        }
      }
    }
    // Enhanced differential pressure gauge - compatible with all fluids
    if(c.type==='dpgauge'){
      const rHi=hu.find(key(c.id,'HI')),rLo=hu.find(key(c.id,'LO'));
      if(rHi&&rLo){
        const p1=comps.find(p=>(p.type==='motor'||p.type==='gearpump'||p.type==='silopump')&&hu.find(key(p.id,'DIS'))===rHi);
        const p2=comps.find(p=>(p.type==='motor'||p.type==='gearpump'||p.type==='silopump')&&hu.find(key(p.id,'DIS'))===rLo);
        const filter=comps.find(p=>p.type==='filter'&&hu.find(key(p.id,'OUT'))===rHi);
        const t1=tanks.find(t=>hu.find(key(t.id,'IN'))===rHi);
        const t2=tanks.find(t=>hu.find(key(t.id,'IN'))===rLo);
        
        // Determine fluid type
        if(c.service==='auto'){
          c.fluid='water';
        }
        
        // Calculate differential pressure
        const pres1=p1?p1.pressure:t1?0.003*t1.level:0;
        const pres2=p2?p2.pressure:t2?0.003*t2.level:0;
        const drop=filter?filter.pressureDrop:0;
        c.pressure=Math.max(0,pres1-pres2-drop);
      }
    }
    // Enhanced vacuum gauge - compatible with steam condenser and gas compressor suction
    if(c.type==='vacuumgauge'){
      const r=hu.find(key(c.id,'IN'));
      if(r){
        const cond=comps.find(p=>p.type==='condenser'&&hu.find(key(p.id,'STEAM_IN'))===r);
        const gc=comps.find(p=>(p.type==='gascompressor'||p.type==='gasboosterpump')&&hu.find(key(p.id,'IN'))===r);
        const pump=comps.find(p=>(p.type==='motor'||p.type==='gearpump'||p.type==='silopump')&&hu.find(key(p.id,'SUC'))===r);
        
        // Determine fluid type
        if(c.service==='auto'){
          if(cond)c.fluid='steam';
          else if(gc)c.fluid='gas';
          else c.fluid='water';
        }
        
        // Get pressure/vacuum based on fluid type
        if(c.fluid==='steam'){
          c.pressure=cond?Math.max(0,1-cond.pressure/100):0;
        }else if(c.fluid==='gas'){
          c.pressure=gc?Math.max(0,1-gc.pressure/100):0;
        }else{
          c.pressure=pump?Math.max(0,1-pump.pressure/5):0;
        }
      }
    }
    // Enhanced rotameter - compatible with water, steam, and gas
    if(c.type==='rotameter'){
      const rIn=hu.find(key(c.id,'IN')),rOut=hu.find(key(c.id,'OUT'));
      if(rIn&&rOut){
        const pump=comps.find(p=>(p.type==='motor'||p.type==='gearpump'||p.type==='silopump')&&hu.find(key(p.id,'DIS'))===rIn);
        const gc=comps.find(p=>(p.type==='gascompressor'||p.type==='gasboosterpump')&&hu.find(key(p.id,'OUT'))===rIn);
        
        // Determine fluid type
        if(c.service==='auto'){
          if(gc)c.fluid='gas';
          else c.fluid='water';
        }
        
        // Get flow based on fluid type
        if(c.fluid==='water'){
          c.flow=pump?pump.flow*600:0;
          c.unit='L/min';
        }else if(c.fluid==='gas'){
          c.flow=gc?gc.flow:0;
          c.unit='m³/h';
        }
        c.total+=c.flow/60*dt;
      }
    }
    if(c.type==='pressurecutoff'){
      const rIn=hu.find(key(c.id,'IN'));
      const upstream=pumps.filter(p=>hu.find(key(p.id,'DIS'))===rIn).reduce((m,p)=>Math.max(m,p.pressure||0),0);
      c.pressure=upstream;
      if(!c.tripped&&c.pressure>=Number(c.setting||5)){c.tripped=true;c.peakPressure=c.pressure;log(`⚠ ${c.label} tripped at ${c.pressure.toFixed(2)} bar — water supply cut off`);}
      if(c.tripped)c.peakPressure=Math.max(c.peakPressure||0,c.pressure||0);
    }
    if(c.type==='reliefvalve'){
      const rIn=hu.find(key(c.id,'IN'));
      const upstream=pumps.filter(p=>hu.find(key(p.id,'DIS'))===rIn).reduce((m,p)=>Math.max(m,p.pressure||0),0);
      const tank=tanks.find(t=>hu.find(key(t.id,'IN'))===rIn || hu.find(key(t.id,'OUT'))===rIn);
      c.pressure=Math.max(upstream,tank?(tank.pressure||0):0);
      // 0.15 bar hysteresis prevents rapid open/close flicker at the set point.
      c.open=c.open?c.pressure>Math.max(0,c.setting-0.15):c.pressure>=c.setting;
    }
    if(c.type==='filter'){
      const rIn=hu.find(key(c.id,'IN'));
      const pump=pumps.find(x=>hu.find(key(x.id,'DIS'))===rIn);
      const q=pump?(pump.flow||0):0;
      c.pressureDrop=(c.clogged?Math.max(1.5,0.8+q*0.15):0.05+q*0.02);
    }
    if(c.type==='accumulator'){
      const r=hu.find(key(c.id,'IN'));
      const pump=pumps.filter(x=>hu.find(key(x.id,'DIS'))===r).reduce((m,x)=>Math.max(m,x.pressure||0),0);
      const tank=tanks.find(x=>hu.find(key(x.id,'IN'))===r || hu.find(key(x.id,'OUT'))===r);
      const linePressure=Math.max(pump,tank?(tank.pressure||0):0);
      // One-port branch accumulator charges when line pressure exceeds precharge,
      // and releases stored fluid as line pressure falls below precharge.
      c.pressure=linePressure || (c.fluid>0?Math.max(0,c.precharge*c.fluid):0);
      const delta=(linePressure-c.precharge)*dt*0.12;
      c.fluid=Math.min(1,Math.max(0,(c.fluid||0)+delta));
    }
    if(c.type==='manifold'){
      const r=hu.find(key(c.id,'IN'));
      c.pressure=pumps.filter(x=>hu.find(key(x.id,'DIS'))===r).reduce((m,x)=>Math.max(m,x.pressure||0),0);
      c.connectedOutlets=['OUT1','OUT2','OUT3'].filter((t,i)=>c['o'+(i+1)]!==false&&wires.some(w=>!w.broken&&((w.a.c===c.id&&w.a.t===t)||(w.b.c===c.id&&w.b.t===t)))).length;
      c.flowing=(c._outF||[]).some(f=>f>0.0005);
    }
    if(c.type==='cylsingle'||c.type==='cyldouble'){const d=c._dir||0,q=(Number(c._in)||0)-(Number(c._out)||0);
      if(d)c.pos=Math.max(0,Math.min(100,(Number(c.pos)||0)+q*dt*(Number(c.speed)||8)*1.75*(d>0?1:-1)));
      c._in=0;c._out=0;if((c.pos>=100&&d>0)||(c.pos<=0&&d<0))c._dir=0;}
    if(c.type==='hydmotor'){const r=hu.find(key(c.id,'IN')),p=pumps.find(x=>hu.find(key(x.id,'DIS'))===r);c._rpm=c.on&&hflow.has(r)?Math.min(3000,(p?Number(p.flow)||0:.15)*2400):0;}
  }

  for(const tp of comps)if(tp.type==='tap'){tp.running=false;if(!tp.open)continue;
    const r=hu.find(key(tp.id,'IN'));const t=tanks.find(t=>hu.find(key(t.id,'OUT'))===r&&t.level>0);
    if(t){t._out+=tp.flow;tp.running=true;hflow.add(r);}}
  for(const sp of sumps)if(!sp.unlimited)sp.level=Math.max(0,Math.min(100,sp.level+(sp.refill-sp._use*0.1)*dt));
  for(const t of tanks){
    const inflow=Math.max(0,t._in||0),outflow=Math.max(0,t._out||0);
    t.level=Math.max(0,Math.min(100,t.level+(inflow-outflow-(Number(t.drain)||0))*dt));
    // Latched overflow alarm: once full-tank inflow triggers it, small solver
    // fluctuations must not clear/retrigger it on adjacent frames. Clear only
    // after the level falls below the reset threshold, or the pump is stopped
    // continuously for a short delay.
    const pumpStillRunning=pumps.some(p=>p.powered);
    if(t.level>=99.95 && inflow>0.001){
      t.overflow=true;
      t._overflowClearTimer=0;
    }else if(t.overflow){
      if(t.level<98.0){
        t.overflow=false;
        t._overflowClearTimer=0;
      }else if(!pumpStillRunning && inflow<=0.001){
        t._overflowClearTimer=(t._overflowClearTimer||0)+dt;
        if(t._overflowClearTimer>=2.0){t.overflow=false;t._overflowClearTimer=0;}
      }else{
        t._overflowClearTimer=0;
      }
    }
    flag('ov'+t.id,t.overflow,`🌊 ${t.label} OVERFLOW – tank at capacity; stop the pump`,`${t.label} overflow cleared`);
    if(t.type==='tank'||t.type==='silo'||t.type==='silopump'){t.temperature=Number(t.temperature)||20;
    if(inflow>0){const hot=pumps.reduce((m,p)=>Math.max(m,p.temperature||20),20);t.temperature+=(hot-t.temperature)*Math.min(1,inflow*dt*0.2);}
    else t.temperature+=(20-t.temperature)*Math.min(1,dt/240);}
  }
  sim.hu=hu;sim.hflow=hflow;
  if(st.cl.bond)warnings.push('N–PE bonded downstream of source');
  sim.st=st;sim.flow=flow;sim.totalI=totalI;sim.power=power;sim.pumping=pumpRate;sim.hazards=hazards;sim.warnings=warnings;
  if(window.Game)window.Game.tick(dt,{st,hu,hflow,warnings,hazards,flow,tanks});
  const al=[];
  if(dead)al.push(['bad','SHORT CIRCUIT – no protective device cleared it']);
  hazards.forEach(h=>al.push(['bad',h]));
  comps.forEach(c=>{if(c.cutout)al.push(['bad',`${c.label} THERMAL CUT-OUT (click motor to reset after cooling)`]);if(c.tripped)al.push(['bad',`${c.label} ${c.type==='pressurecutoff'?'PRESSURE CUT-OFF ACTIVE':c.type==='bms'?'BMS '+ (c.status||'TRIP'):'TRIPPED'}`]);if(c.overflow)al.push(['bad',`${c.label} OVERFLOW`]);if(c.type==='bms'&&c.on&&(!c.chgOk||!c.dsgOk)&&!c.tripped)al.push(['warn',`${c.label} ${!c.dsgOk?'discharge':'charge'} MOSFET open`]);});
  warnings.forEach(w=>al.push(['warn',w]));
  sim.alarms=al;
}
function earthFault(c,st,hazards){
  const rcd=comps.find(r=>r.type==='rcd'&&r.closed&&!r.tripped);
  if(rcd){rcd.tripped=true;log(`⚠ ${rcd.label} tripped: earth leakage from ${c.label}`);return;}
  if(ntype(st,c,'PE')==='PE'){
    const m=comps.filter(b=>b.type==='mcb'&&b.closed&&!b.tripped).sort((a,b)=>a.rating-b.rating)[0];
    if(m){m.tripped=true;log(`⚠ ${m.label} tripped: earth-fault current from ${c.label} via PE`);return;}
  }
  hazards.push(`HAZARD: ${c.label} enclosure live (earth fault, no RCD/PE path)`);
}
function resetSim(){
  for(const c of comps){if('tripped'in c)c.tripped=false;if('heat'in c)c.heat=0;if(c.type==='contactor')c.coilOn=false;if(c.type==='float')c.up=false;
    if(c.type==='tank'||c.type==='silo'||c.type==='silopump'){c.level=c.type==='tank'?24:35;c.overflow=false;c.temperature=20;}if(c.type==='sump')c.level=100;if(c.type==='motor'||c.type==='gearpump'||c.type==='silopump'){c.cutout=false;c.dryHeat=0;}if(c.type==='pb')c.pressed=false;if(c.type==='pressurecutoff'){c.tripped=false;c.pressure=0;c.peakPressure=0;}if(c.type==='timer'){c.elapsed=0;c.coilOn=false;c.output=false;c.remaining=c.delay;}
    if(c.type==='battery'){c.soc=50;c.charging=false;c.discharging=false;c.voltage=12;}
    if(c.type==='lfpbattery'){c.soc=50;c.charging=false;c.discharging=false;c.temperature=Number(c.ambient)||25;c.voltage=packNomV(c);c._packI=0;}
    if(c.type==='bms'){c.tripped=false;c.chgOk=true;c.dsgOk=true;c.status='OK';c.current=0;}
    if(c.type==='hybrid'||c.type==='hybridlfp'||c.type==='hybridlfpgt'||c.type==='hybridbms'){c.tripped=false;c._bypass=null;c._src='NONE';c._out=undefined;c._lowLock=false;c._gridHold=false;c.status='STANDBY';c.mode='OFF';c.loadW=0;c._dcW=0;c._chgW=0;c.pvW=0;c.canOnline=false;}
    if(c.type==='acvawmeter'||c.type==='dcvawmeter'){c.voltage=0;c.current=0;c.watts=0;c.kwh=0;}
    if(c.type==='inverter'){c.tripped=false;c._bypass=false;c._out=undefined;c._lowLock=false;c.status='STANDBY';c.mode='OFF';c.loadW=0;c._dcW=0;c._chgW=0;}
    if(c.type==='solar'){c.outputPower=0;c.current=0;c._cellTemp=Number(c.ambient)||25;c._irradiance=0;c.status='IDLE';}
    if(c.type==='wind'){c.outputPower=0;c.current=0;c.rpm=0;c.ang=0;c._instWind=c.windSpeed||0;c._gust=0;c.status='IDLE';}
    if(c.type==='generator'){c.on=false;c.fuel=100;c.outputPower=0;}
    if(c.type==='heater'){c.temperature=20;c.powered=false;}
    if(c.type==='fan'){c.speed=0;c.powered=false;}
    if(c.type==='ledstrip'){c.brightness=0;c.powered=false;}
    if(c.type==='solenoid'){c.open=false;c.powered=false;}
    if(c.type==='vfd'){c.on=false;c.rpm=0;c.torque=0;}
    if(c.type==='softstart'){c.on=false;}
    if(c.type==='relay'){c.coilOn=false;}
    if(c.type==='ssr'){c.on=false;}
    if(c.type==='disconnect'){c.closed=true;}
    if(c.type==='capacitorbank'||c.type==='pfccap'){c.connected=false;}
    if(c.type==='fuse'){c.blown=false;}
    if(c.type==='supercap'){c.soc=50;c.voltage=2.7;}
    if(c.type==='energymeter'){c.kwh=0;c.kw=0;}
    if(c.type==='gasturbine'){c.on=false;c.fuel=100;c.temperature=20;c.outputPower=0;}
    if(c.type==='steamturbine'){c.on=false;c.outputPower=0;}
    if(c.type==='boiler'){c.on=false;c.temperature=200;c.pressure=100;}
    if(c.type==='airsupply'){c._spd=0;c._heat=0;c.cutout=false;c.powered=false;c.I=0;}
    if(c.type==='gascompressor'){c.on=false;c.pressure=20;c.flow=0;}
    if(c.type==='gasboosterpump'){c.on=false;c.pressure=30;c.flow=0;}
    if(c.type==='steamboosterpump'){c.on=false;c.pressure=40;c.flow=0;}
    if(c.type==='gasvalve'){c.open=false;}
    if(c.type==='gastank'){c.level=80;c.pressure=20;}
    if(c.type==='feedwaterpump'){c.on=false;c.flow=0;c.pressure=0;}
    if(c.type==='gatevalve'||c.type==='globevalve'||c.type==='ballvalve'||c.type==='butterflyvalve'){c.open=false;}
    if(c.type==='steamtrap'){c.open=false;c.condensate=0;}
    if(c.type==='differentialrelay'||c.type==='overcurrentrelay'){c.tripped=false;}
    if(c.type==='synchroscope'){c.angle=0;c.freqDiff=0;c.voltDiff=0;}
    if(c.type==='feedwatertank'){c.level=70;c.temperature=120;}
    if(c.type==='blowdown'){c.open=false;}
    if(c.type==='gaswell'){c.on=false;c.pressure=50;c.flow=0;}
    if(c.type==='naturalgas'){c.on=true;c.pressure=20;c.flow=500;}
    if(c.type==='lpgtank'){c.level=80;c.pressure=8;}
    if(c.type==='burner'){c.on=false;c.flameTemp=1200;}
    if(c.type==='combustionchamber'){c.on=false;c.temperature=1500;}
    if(c.type==='steamsource'){c.on=true;c.pressure=100;c.temperature=500;}
    if(c.type==='steamgenerator'){c.on=false;c.temperature=500;}
    if(c.type==='flame'){c.on=false;c.temperature=1200;}
    if(c.type==='furnace'){c.on=false;c.temperature=800;}
  }
  for(const k in flags)delete flags[k];log('Simulation reset.');
}

/* ───────────── template ───────────── */
function loadTemplate(){
  pushUndo();comps=[];wires=[];nextId=1;selected=null;
  const add=(t,x,y,r,ex)=>{const c=newComp(t,x,y,r||0);Object.assign(c,ex||{});comps.push(c);return c;};
  const L=(a,ta,b,tb,pts)=>wires.push({id:nextId++,a:{c:a.id,t:ta},b:{c:b.id,t:tb},pts:pts||[],bend:0,broken:false});
  const S=add('source',100,160,0,{label:'Mains'});
  const Q=add('mcb',260,160,0,{label:'QF1'});
  const K=add('contactor',560,160,0,{label:'KM1'});
  const J=add('junction',400,180,0,{label:'N-tap'});
  const F=add('float',800,160,2,{label:'FS1'});
  const M=add('motor',560,380,0,{label:'M1'});
  add('tank',1030,230,0,{label:'Tank',drain:0});const V=add('valve',760,360,0,{label:'V1'});const WS=add('sump',780,450,0,{label:'Source'});const TP=add('tap',1180,290,0,{label:'Tap',flow:0.4});const TK=comps.find(c=>c.type==='tank');
  L(S,'L',Q,'Lin');L(S,'N',Q,'Nin');
  L(Q,'Lout',K,'L1',[{x:330,y:140},{x:330,y:60},{x:530,y:60}]);
  L(Q,'Lout',F,'COM',[{x:330,y:140},{x:330,y:40},{x:900,y:40},{x:900,y:160}]);
  L(Q,'Nout',J,'l');
  L(J,'t',K,'L2',[{x:400,y:80},{x:590,y:80}]);
  L(J,'b',K,'A2',[{x:400,y:300},{x:660,y:300},{x:660,y:180}]);
  L(F,'NC',K,'A1',[{x:690,y:180},{x:690,y:140}]);
  L(K,'T1',M,'L',[{x:530,y:250},{x:480,y:250},{x:480,y:360}]);
  L(K,'T2',M,'N',[{x:590,y:270},{x:460,y:270},{x:460,y:380}]);
  L(S,'PE',M,'PE',[{x:100,y:470},{x:560,y:470}]);
  L(M,'DIS',V,'a');L(V,'b',TK,'IN',[{x:900,y:360},{x:900,y:280}]);L(WS,'OUT',M,'SUC');L(TK,'OUT',TP,'IN');
  renderProps();fit();log('Loaded template: float NC → contactor coil → pump; water source → pump → valve → tank → tap.');
}

/* ───────────── canvas ───────────── */
const cv=$('cv'),ctx=cv.getContext('2d');let DPR=1,fdt=0.016,lastT=performance.now(),NOW=0;
function DT(){return fdt||0.016;} // frame delta used by spinning rotors / turbines
function resize(){DPR=window.devicePixelRatio||1;const r=cv.getBoundingClientRect();cv.width=Math.max(1,r.width*DPR);cv.height=Math.max(1,r.height*DPR);}
new ResizeObserver(resize).observe($('stage'));
const toWorld=(cx,cy)=>({x:(cx-view.x)/view.z,y:(cy-view.y)/view.z});
function fit(){
  const r=cv.getBoundingClientRect();if(!comps.length){view.x=60;view.y=40;view.z=1;return;}
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const c of comps){const d=DEFS[c.type],hw=Math.max(d.w,d.h)/2+30;x0=Math.min(x0,c.x-hw);y0=Math.min(y0,c.y-hw);x1=Math.max(x1,c.x+hw);y1=Math.max(y1,c.y+hw);}
  const z=Math.max(.25,Math.min(1.6,Math.min(r.width/(x1-x0),(r.height-60)/(y1-y0))));
  view.z=z;view.x=(r.width-(x1-x0)*z)/2-x0*z;view.y=(r.height-(y1-y0)*z)/2-y0*z+20;
}
function rr(x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);}
function body(c,w,h,edge){rr(-w/2,-h/2,w,h,8);ctx.fillStyle=COL.body;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=edge||COL.edge;ctx.stroke();
  if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';ctx.lineWidth=2;rr(-w/2-3,-h/2-3,w+6,h+6,10);ctx.stroke();ctx.restore();}}
function txt(c,s,x,y,color,size,align,weight){ctx.save();ctx.translate(x,y);ctx.rotate(-c.rot*Math.PI/2);ctx.fillStyle=color||COL.text;
  ctx.font=`${weight||600} ${size||10}px Inter,system-ui,sans-serif`;ctx.textAlign=align||'center';ctx.textBaseline='middle';ctx.fillText(s,0,0);ctx.restore();}
function line(pts,color,lw){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.strokeStyle=color;ctx.lineWidth=lw||2;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();}

const DRAW={
  source(c){const o=c.on;body(c,100,80,o?COL.live:COL.edge);
    ctx.beginPath();for(let i=0;i<=40;i++){const x=-34+i*1.2,y=-6+Math.sin(i/40*Math.PI*4)*8;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.strokeStyle=o?COL.live:COL.off;ctx.lineWidth=2;ctx.stroke();
    txt(c,c.label,-4,-28,COL.text,10);txt(c,o?c.volts+' V AC':'OFF',-4,14,o?COL.live:COL.bad,11,'center',800);txt(c,'click: on/off',-4,30,COL.mut,8);},
  overload(c){body(c,80,44,c.tripped?COL.bad:COL.edge);line([[-40,0],[-22,0],[-16,-8],[-8,8],[0,-8],[8,8],[16,-8],[22,0],[40,0]],c.tripped?COL.bad:COL.warn,2);
    txt(c,c.label+' · '+c.setting+'A',0,-14,COL.text,9);if(c.tripped)txt(c,'TRIPPED',0,14,COL.bad,8,'center',800);},
  gearpump(c){body(c,150,140,c.powered?COL.ok:COL.edge);txt(c,c.label+' · '+c.hp+' HP',0,-56,COL.text,10);
    // Gear-pump casing with two meshing gears
    rr(-52,-34,104,68,10);ctx.fillStyle='#0c1a2a';ctx.fill();ctx.strokeStyle=c.powered?COL.ok:'#4a6a8a';ctx.lineWidth=2.5;ctx.stroke();
    const sp=(c.spin||0)*(c.powered?1:0);if(sp>0)c.ang=(c.ang||0)+fdt*sim.speed*10*sp;
    const drawGear=(x,y,dir)=>{ctx.save();ctx.translate(x,y);ctx.rotate((c.ang||0)*dir);
      ctx.fillStyle=c.powered?'#1d4d3a':'#22303e';ctx.strokeStyle=c.powered?COL.ok:'#4a6a8a';ctx.lineWidth=1.5;
      for(let i=0;i<8;i++){ctx.save();ctx.rotate(i*Math.PI/4);ctx.fillRect(-3.5,-17,7,7);ctx.restore();}
      ctx.beginPath();ctx.arc(0,0,13,0,7);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.arc(0,0,4,0,7);ctx.fillStyle=c.powered?COL.ok:'#4a6a8a';ctx.fill();ctx.restore();};
    drawGear(-16,-4,1);drawGear(16,4,-1);
    // shaft stub on top
    ctx.fillStyle='#8a97a5';ctx.fillRect(-4,-70,8,14);ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1;ctx.strokeRect(-4,-70,8,14);
    txt(c,'SHAFT',0,-74,COL.mut,7,'center',700);
    // water ports
    line([[-75,-25],[-58,-25]],'#59c3ff',6);line([[58,-25],[75,-25]],'#59c3ff',6);
    txt(c,'SUC',-72,-32,COL.neu,8,'center',700);txt(c,'DIS',72,-32,COL.warn,8,'center',700);
    if(c.powered&&c.flow>0.001){ctx.save();ctx.setLineDash([5,7]);ctx.lineDashOffset=-NOW*.02;line([[-70,-25],[70,-25]],'rgba(89,195,255,.6)',2);ctx.setLineDash([]);ctx.restore();}
    if(c.powered)glow(0,0,55,'rgba(6,214,160,.3)');
    // electrical terminals
    for(const[t,x]of[['L',-45],['N',-15],['PE',15]]){ctx.beginPath();ctx.arc(x,65,4,0,7);ctx.fillStyle=COL.edge;ctx.fill();ctx.strokeStyle=COL.mut;ctx.lineWidth=1;ctx.stroke();txt(c,t,x,80,COL.mut,7,'center',700);}
    const s=c.cutout?'CUT-OUT':c.powered?(c.startT<1.5?'STARTING':'RUNNING'):'STOPPED';
    txt(c,s+(c.drive==='shaft'?' ·SHAFT':c.drive==='motor'?' ·MOTOR':''),0,46,c.powered?COL.ok:COL.mut,9,'center',800);
    if(c.powered){txt(c,(c.pressure||0).toFixed(1)+' bar · '+((c.flow||0)*600).toFixed(0)+' L/min',0,58,COL.warn,8,'center',800);}
    if(c.fault==='earth')txt(c,'⚠ earth leak',0,-44,COL.warn,8);},
  silo(c){const W=160,H=330,top=-H/2+16,bot=H/2-10,ih=bot-top;
    // silo roof (cone/dish top)
    ctx.beginPath();ctx.moveTo(-W/2+14,-H/2+8);ctx.quadraticCurveTo(0,-H/2-26,W/2-14,-H/2+8);ctx.closePath();ctx.fillStyle='#16283f';ctx.fill();ctx.strokeStyle='#4a6a8a';ctx.lineWidth=2;ctx.stroke();
    rr(-W/2,-H/2+8,W,H-8,10);ctx.fillStyle='#0d1c30';ctx.fill();
    const y=bot-ih*c.level/100;
    ctx.save();rr(-W/2+4,-H/2+12,W-8,H-12,8);ctx.clip();
    const g=ctx.createLinearGradient(0,y,0,bot);g.addColorStop(0,'rgba(0,180,216,.8)');g.addColorStop(1,'rgba(2,62,138,.9)');ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(-W/2,bot+10);for(let x=-W/2;x<=W/2;x+=4)ctx.lineTo(x,y+Math.sin(x*.07+NOW*.003)*2.2);ctx.lineTo(W/2,bot+10);ctx.fill();ctx.restore();
    ctx.lineWidth=2.5;ctx.strokeStyle=c.overflow?COL.bad:'#4a7aa5';rr(-W/2,-H/2+8,W,H-8,10);ctx.stroke();
    if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';rr(-W/2-3,-H/2-3,W+6,H+6,12);ctx.stroke();ctx.restore();}
    for(let p=0;p<=100;p+=25){const yy=bot-ih*p/100;line([[W/2-12,yy],[W/2-4,yy]],COL.mut,1);txt(c,p+'%',W/2-16,yy,COL.mut,8,'right');}
    txt(c,c.label,0,-H/2-30,COL.text,11,'center',800);txt(c,c.level.toFixed(0)+'%',-10,-H/2+44,'#fff',16,'center',800);
    txt(c,'SILO',0,H/2-24,COL.mut,8,'center',700);
    if(sim.pumping>0)txt(c,'▲ filling',0,H/2+14,COL.ok,9,'center',800);if(c.overflow)txt(c,'OVERFLOW',0,-H/2+2,COL.bad,10,'center',800);},
  silopump(c){const W=160,H=330,top=-H/2+16,bot=H/2-10,ih=bot-top;
    ctx.beginPath();ctx.moveTo(-W/2+14,-H/2+8);ctx.quadraticCurveTo(0,-H/2-26,W/2-14,-H/2+8);ctx.closePath();ctx.fillStyle='#16283f';ctx.fill();ctx.strokeStyle='#4a6a8a';ctx.lineWidth=2;ctx.stroke();
    rr(-W/2,-H/2+8,W,H-8,10);ctx.fillStyle='#0d1c30';ctx.fill();
    const y=bot-ih*c.level/100;
    ctx.save();rr(-W/2+4,-H/2+12,W-8,H-12,8);ctx.clip();
    const g=ctx.createLinearGradient(0,y,0,bot);g.addColorStop(0,'rgba(0,180,216,.8)');g.addColorStop(1,'rgba(2,62,138,.9)');ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(-W/2,bot+10);for(let x=-W/2;x<=W/2;x+=4)ctx.lineTo(x,y+Math.sin(x*.07+NOW*.003)*2.2);ctx.lineTo(W/2,bot+10);ctx.fill();ctx.restore();
    ctx.lineWidth=2.5;ctx.strokeStyle=c.overflow?COL.bad:'#4a7aa5';rr(-W/2,-H/2+8,W,H-8,10);ctx.stroke();
    if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';rr(-W/2-3,-H/2-3,W+6,H+6,12);ctx.stroke();ctx.restore();}
    for(let p=0;p<=100;p+=25){const yy=bot-ih*p/100;line([[W/2-12,yy],[W/2-4,yy]],COL.mut,1);txt(c,p+'%',W/2-16,yy,COL.mut,8,'right');}
    txt(c,c.label,0,-H/2-30,COL.text,11,'center',800);txt(c,c.level.toFixed(0)+'%',-10,-H/2+44,'#fff',16,'center',800);
    // integrated pump skid at the bottom
    rr(-46,H/2-58,92,40,6);ctx.fillStyle='#13233a';ctx.fill();ctx.strokeStyle=c.powered?COL.ok:'#4a6a8a';ctx.lineWidth=2;ctx.stroke();
    const sp=(c.spin||0)*(c.powered?1:0);if(sp>0)c.ang=(c.ang||0)+fdt*sim.speed*9*sp;
    const dg=(x,y,dir)=>{ctx.save();ctx.translate(x,y);ctx.rotate((c.ang||0)*dir);ctx.fillStyle=c.powered?'#1d4d3a':'#22303e';ctx.strokeStyle=c.powered?COL.ok:'#4a6a8a';ctx.lineWidth=1.2;
      for(let i=0;i<8;i++){ctx.save();ctx.rotate(i*Math.PI/4);ctx.fillRect(-3,-13,6,6);ctx.restore();}
      ctx.beginPath();ctx.arc(0,0,10,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(0,0,3.5,0,7);ctx.fillStyle=c.powered?COL.ok:'#4a6a8a';ctx.fill();ctx.restore();};
    dg(-16,H/2-38,1);dg(16,H/2-38,-1);
    txt(c,'PUMP',0,H/2-14,COL.mut,8,'center',700);
    // ports
    line([[-80,40],[-52,40]],'#59c3ff',5);line([[-80,110],[-52,110]],'#59c3ff',5);line([[52,110],[80,110]],'#f0a35e',5);
    txt(c,'IN',-88,40,COL.neu,8,'center',700);txt(c,'OUT',-88,110,COL.mut,8,'center',700);txt(c,'DIS',88,110,COL.warn,8,'center',700);
    if(c.powered&&c.flow>0.001){ctx.save();ctx.setLineDash([5,7]);ctx.lineDashOffset=-NOW*.02;line([[52,110],[80,110]],'rgba(240,163,94,.6)',2);ctx.setLineDash([]);ctx.restore();}
    if(c.powered)glow(0,H/2-38,45,'rgba(6,214,160,.3)');
    for(const[t,x]of[['L',-50],['N',-20],['PE',10]]){ctx.beginPath();ctx.arc(x,160,4,0,7);ctx.fillStyle=COL.edge;ctx.fill();ctx.strokeStyle=COL.mut;ctx.lineWidth=1;ctx.stroke();txt(c,t,x,176,COL.mut,7,'center',700);}
    const s=c.cutout?'CUT-OUT':c.powered?(c.startT<1.5?'STARTING':'RUNNING'):'STOPPED';
    txt(c,s,0,H/2+16,c.powered?COL.ok:COL.mut,9,'center',800);
    if(c.powered)txt(c,(c.pressure||0).toFixed(1)+' bar · '+((c.flow||0)*600).toFixed(0)+' L/min',0,H/2+28,COL.warn,8,'center',800);
    if(sim.pumping>0)txt(c,'▲ filling',0,H/2+44,COL.ok,9,'center',800);if(c.overflow)txt(c,'OVERFLOW',0,-H/2+2,COL.bad,10,'center',800);
    if(c.fault==='earth')txt(c,'⚠ earth leak',0,-H/2-18,COL.warn,8);},
  junction(c){for(const t of DEFS.junction.term)line([[0,0],[t[1],t[2]]],COL.mut,2);ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.fillStyle=isSel(c)?'#00b4d8':COL.text;ctx.fill();},
  sump(c){const W=120,H=80,f=c.unlimited?1:c.level/100,top=-H/2+6,bot=H/2-4,y=bot-(bot-top)*f;
    rr(-W/2,-H/2,W,H,8);ctx.fillStyle='#0d1c30';ctx.fill();
    ctx.save();rr(-W/2+3,-H/2+3,W-6,H-6,6);ctx.clip();const g=ctx.createLinearGradient(0,y,0,bot);g.addColorStop(0,'rgba(0,180,216,.7)');g.addColorStop(1,'rgba(2,62,138,.9)');ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(-W/2,bot+4);for(let x=-W/2;x<=W/2;x+=4)ctx.lineTo(x,y+Math.sin(x*.08+NOW*.003)*1.8);ctx.lineTo(W/2,bot+4);ctx.fill();ctx.restore();
    ctx.lineWidth=2.5;ctx.strokeStyle=f<=0?COL.bad:'#4a7aa5';rr(-W/2,-H/2,W,H,8);ctx.stroke();
    if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';rr(-W/2-3,-H/2-3,W+6,H+6,10);ctx.stroke();ctx.restore();}
    txt(c,c.label+' · water source',0,-H/2-10,COL.text,10);txt(c,c.unlimited?'∞':c.level.toFixed(0)+'%',0,0,'#fff',15,'center',800);},
  tee(c){for(const t of DEFS.tee.term)line([[0,0],[t[1],t[2]]],'#2f6f9f',6);ctx.beginPath();ctx.arc(0,0,6,0,7);ctx.fillStyle=isSel(c)?'#00b4d8':'#59c3ff';ctx.fill();},
  flowmeter(c){body(c,70,50,COL.edge);line([[-35,0],[35,0]],'#2a5d85',6);ctx.beginPath();ctx.arc(0,0,15,0,7);ctx.fillStyle='#0b1628';ctx.fill();ctx.strokeStyle=COL.neu;ctx.lineWidth=2;ctx.stroke();
    for(let i=0;i<4;i++){const a=(NOW*.004+i*Math.PI/2);ctx.beginPath();ctx.arc(Math.cos(a)*8,Math.sin(a)*8,2.5,0,7);ctx.fillStyle=c.flow>0.01?COL.ok:COL.off;ctx.fill();}
    txt(c,(c.flow||0).toFixed(1)+' L/min',0,-17,COL.text,8,'center',800);txt(c,'Σ '+(c.total||0).toFixed(1)+' L',0,19,COL.mut,8);},
  accumulator(c){body(c,80,100,COL.edge);rr(-27,-38,54,76,20);ctx.fillStyle='#10243a';ctx.fill();ctx.strokeStyle=COL.edge;ctx.stroke();const h=66*Math.max(0,Math.min(1,Number.isFinite(c.fluid)?c.fluid:0));rr(-23,28-h,46,h,12);ctx.fillStyle='#167fb0';ctx.fill();ctx.strokeStyle='#59c3ff';ctx.stroke();line([[-18,-4],[18,-4]],COL.warn,2);txt(c,'N₂',0,-22,COL.warn,9);txt(c,(c.pressure||0).toFixed(1)+' bar',0,0,COL.text,8);txt(c,'pre '+(c.precharge||0)+' bar',0,44,COL.mut,8);txt(c,c.fluid>=0.98?'FULL':c.fluid<=0.02?'EMPTY':'CHARGING',0,58,c.fluid>=0.98?COL.ok:COL.mut,7);},
  filter(c){body(c,70,70,c.clogged?COL.bad:COL.edge);line([[-35,0],[-22,0]],'#59c3ff',4);line([[22,0],[35,0]],'#59c3ff',4);for(let i=-2;i<=2;i++)line([[-20,i*7-7],[20,i*7+7]],c.clogged?COL.bad:COL.warn,2);txt(c,c.clogged?'CLOGGED':'FILTER',0,-23,c.clogged?COL.bad:COL.text,8,'center',800);txt(c,'ΔP '+(c.pressureDrop||0).toFixed(1)+' bar',0,25,COL.mut,8);},
  solar(c){
  const G=c._irradiance!=null?c._irradiance:((c.sunIntensity||80)/100*1000);
  const gen=(c.outputPower||0)>5;
  const hot=(c._cellTemp||25)>60;
  const fault=c.fault&&c.fault!=='none';
  const col=fault?COL.bad:gen?(hot?COL.warn:COL.ok):COL.edge;
  body(c,150,110,col);

  // Aluminium frame
  ctx.fillStyle='#2a3545';ctx.fillRect(-68,-42,136,84);
  ctx.strokeStyle='#5a6a7c';ctx.lineWidth=2;ctx.strokeRect(-68,-42,136,84);

  // Glass / cells background
  const intensity=Math.min(1,G/900);
  ctx.fillStyle=intensity>0.15?'#0a1a2e':'#0c1420';
  ctx.fillRect(-62,-36,124,72);

  // Moving cloud shadow band (when partially cloudy)
  const cloudiness=Math.max(0,Number(c.cloudiness)||0);
  if(cloudiness>0.05&&intensity>0.1){
    const band=((NOW*0.00015)+ (c.id||1)*0.3)%1;
    const bx=-70+band*140;
    const grd=ctx.createLinearGradient(bx,0,bx+40,0);
    grd.addColorStop(0,'rgba(0,0,0,0)');
    grd.addColorStop(0.4,`rgba(10,20,40,${0.25+cloudiness*0.35})`);
    grd.addColorStop(0.6,`rgba(10,20,40,${0.25+cloudiness*0.35})`);
    grd.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=grd;ctx.fillRect(-62,-36,124,72);
  }

  // PV cells (6×4)
  const rows=4,cols=6,cw=18,ch=15,gap=2;
  const ox=-62+(124-(cols*cw+(cols-1)*gap))/2;
  const oy=-36+(72-(rows*ch+(rows-1)*gap))/2;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const x=ox+i*(cw+gap),y=oy+j*(ch+gap);
    // Subtle shimmer per cell
    const shimmer=gen?0.06*Math.sin(NOW*0.008+(i+j)*0.9):0;
    const r=20+intensity*30+shimmer*40,g=40+intensity*90+shimmer*50,b=70+intensity*100;
    ctx.fillStyle=`rgb(${Math.min(255,r|0)},${Math.min(255,g|0)},${Math.min(255,b|0)})`;
    ctx.fillRect(x,y,cw,ch);
    ctx.strokeStyle=intensity>0.2?'rgba(200,210,220,0.5)':'rgba(80,90,100,0.4)';
    ctx.lineWidth=0.7;
    ctx.beginPath();ctx.moveTo(x+cw*0.33,y);ctx.lineTo(x+cw*0.33,y+ch);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+cw*0.66,y);ctx.lineTo(x+cw*0.66,y+ch);ctx.stroke();
    ctx.strokeStyle='rgba(0,0,0,0.35)';ctx.lineWidth=0.5;ctx.strokeRect(x,y,cw,ch);
  }

  // Specular glint that sweeps across the panel when generating
  if(gen&&intensity>0.25){
    const gx=((NOW*0.0004)+(c.id||1)*0.2)%1;
    const gxPos=-60+gx*120;
    const gg=ctx.createLinearGradient(gxPos, -40, gxPos+18, 40);
    gg.addColorStop(0,'rgba(255,255,255,0)');
    gg.addColorStop(0.45,`rgba(255,245,200,${0.12+intensity*0.18})`);
    gg.addColorStop(0.55,`rgba(255,245,200,${0.12+intensity*0.18})`);
    gg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=gg;ctx.fillRect(-62,-36,124,72);
  }

  // Junction box
  ctx.fillStyle='#1a2535';ctx.fillRect(-12,28,24,8);
  ctx.strokeStyle='#4a5a6c';ctx.lineWidth=1;ctx.strokeRect(-12,28,24,8);

  // Soft power glow + pulse
  if(gen){
    const pulse=0.85+0.15*Math.sin(NOW*0.006);
    glow(0,0,50+intensity*40,`rgba(255,200,60,${(0.12+intensity*0.22)*pulse})`);
  }

  // Labels
  txt(c,c.label,0,-52,COL.text,10);
  txt(c,`${Math.round(G)} W/m²`,0,52,gen?COL.warn:COL.mut,9,'center',800);
  txt(c,`${(c.outputPower||0).toFixed(0)} W`,0,64,gen?COL.ok:COL.mut,9,'center',800);
  if(c._cellTemp!=null)txt(c,`${c._cellTemp.toFixed(0)}°C`,0,76,hot?COL.warn:COL.mut,8,'center',700);
  if(fault)txt(c,(c.fault||'').toUpperCase(),0,-62,COL.bad,8,'center',800);
},
  battery(c){const soc=c.soc||50;body(c,120,100,soc>50?COL.ok:soc>20?COL.warn:COL.bad);
    // Battery housing
    ctx.fillStyle='#1a2a3c';ctx.fillRect(-50,-40,100,80);
    ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-50,-40,100,80);
    // Battery terminals
    ctx.fillStyle='#8aaacc';ctx.fillRect(-15,-48,30,8);
    ctx.fillStyle='#6a8aac';ctx.fillRect(-12,-45,24,4);
    // Charge level indicator
    const fillH=68*soc/100;ctx.fillStyle=soc>50?'#22c55e':soc>20?'#f59e0b':'#ef4444';
    ctx.fillRect(-46,34-fillH,92,fillH);
    // Grid lines
    ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;
    for(let i=1;i<5;i++){const y=34-i*13.6;ctx.beginPath();ctx.moveTo(-46,y);ctx.lineTo(46,y);ctx.stroke();}
    txt(c,c.label,0,-52,COL.text,10);
    txt(c,`${soc.toFixed(0)}% SOC`,0,52,COL.text,11,'center',800);
    txt(c,`${c.voltage.toFixed(1)}V`,0,64,c.charging?COL.ok:c.discharging?COL.warn:COL.mut,8,'center',800);
    if(c.charging)txt(c,'⚡ CHARGING',0,-20,COL.ok,8,'center',800);
    if(c.discharging)txt(c,'🔋 DISCHARGING',0,-20,COL.warn,8,'center',800);},
  inverter(c){const on=c.on,out=on&&c._out!==false&&(c._dcW>0||c._bypass||c.mode==='INVERTING');
    const bad=/OVERLOAD|LOW|NO DC/.test(c.status||''),col=!on?COL.edge:bad?COL.bad:c.mode==='CHARGING'?COL.warn:COL.ok;
    body(c,140,100,col);
    ctx.fillStyle='#1a2a3c';ctx.fillRect(-60,-40,120,80);
    ctx.strokeStyle=col;ctx.lineWidth=2;ctx.strokeRect(-60,-40,120,80);
    // DC→AC symbol: flat line, arrow, sine wave
    ctx.beginPath();ctx.moveTo(-50,-12);ctx.lineTo(-30,-12);ctx.strokeStyle=on?COL.warn:COL.mut;ctx.lineWidth=2;ctx.stroke();
    ctx.beginPath();ctx.moveTo(-24,-12);ctx.lineTo(-14,-12);ctx.lineTo(-18,-16);ctx.moveTo(-14,-12);ctx.lineTo(-18,-8);ctx.strokeStyle=COL.mut;ctx.stroke();
    ctx.beginPath();for(let i=0;i<=20;i++){const x=-8+i*2.8,y=-12+(out?Math.sin(i*0.6+(performance.now()/200))*9:0);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.strokeStyle=out?COL.ok:COL.mut;ctx.stroke();
    // mini load bar
    const frac=Math.min(1,(c.loadW||0)/Math.max(1,c.rating||1));
    ctx.fillStyle='#0d1824';ctx.fillRect(-50,6,100,7);ctx.fillStyle=frac>1?COL.bad:frac>.8?COL.warn:COL.ok;ctx.fillRect(-50,6,100*frac,7);
    ctx.beginPath();ctx.arc(48,-30,5,0,7);ctx.fillStyle=out?COL.ok:bad?COL.bad:COL.mut;ctx.fill();
    txt(c,c.label,0,-48,COL.text,10);
    txt(c,`${Math.round(c.loadW||0)} / ${c.rating} W`,0,26,COL.mut,8,'center',800);
    txt(c,c.status||(on?'STANDBY':'OFF'),0,36,on?(bad?COL.bad:COL.ok):COL.mut,9,'center',800);
    txt(c,`${(c.efficiency*100).toFixed(0)}% eff${c.chargeMode?' · chg '+c.chargeCurrent+'A':''}`,0,64,COL.mut,8,'center',800);},
  lfpbattery(c){const soc=c.soc||50,v=packV(c),okc=soc>20&&!(c.temperature>55);body(c,150,120,okc?(soc>30?COL.ok:COL.warn):COL.bad);
    ctx.fillStyle='#122033';ctx.fillRect(-62,-42,124,84);ctx.strokeStyle='#3d8f6e';ctx.lineWidth=2;ctx.strokeRect(-62,-42,124,84);
    const fillH=72*soc/100;ctx.fillStyle=soc>30?'#22c55e':soc>15?'#f59e0b':'#ef4444';ctx.fillRect(-58,38-fillH,116,fillH);
    ctx.strokeStyle='rgba(255,255,255,.18)';for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(-58,38-i*18);ctx.lineTo(58,38-i*18);ctx.stroke();}
    txt(c,c.label,0,-54,COL.text,10);txt(c,'LiFePO4',0,-18,COL.ok,9,'center',800);
    txt(c,`${soc.toFixed(0)}% · ${v.toFixed(1)} V`,0,52,COL.text,10,'center',800);
    txt(c,`${packSeries(c)}S${packParallel(c)}P · ${packAh(c).toFixed(0)} Ah`,0,66,COL.mut,8,'center',800);
    if(c.charging)txt(c,'CHG',-40,8,COL.ok,8,'center',800);if(c.discharging)txt(c,'DSG',40,8,COL.warn,8,'center',800);},
  bms(c){const okc=c.on&&!c.tripped&&c.chgOk&&c.dsgOk;body(c,150,120,!c.on?COL.edge:c.tripped?COL.bad:okc?COL.ok:COL.warn);
    ctx.fillStyle='#101c2c';ctx.fillRect(-62,-40,124,80);ctx.strokeStyle=okc?COL.ok:COL.warn;ctx.lineWidth=2;ctx.strokeRect(-62,-40,124,80);
    txt(c,'BMS LFP',0,-22,COL.text,11,'center',800);
    txt(c,c.status||'OK',0,-4,c.tripped?COL.bad:okc?COL.ok:COL.warn,10,'center',800);
    txt(c,`${(c.packV||0).toFixed(1)} V · ${(c.current||0).toFixed(1)} A`,0,14,COL.mut,8,'center',800);
    txt(c,`CHG ${c.chgOk?'ON':'OFF'}  DSG ${c.dsgOk?'ON':'OFF'}`,0,30,COL.mut,8,'center',800);
    txt(c,c.label,0,-54,COL.text,10);txt(c,c.on?'ACTIVE':'OFF',0,54,c.on?COL.ok:COL.mut,8,'center',800);},
  acvawmeter(c){body(c,100,90,COL.neu);ctx.fillStyle='#071018';ctx.fillRect(-40,-32,80,50);ctx.strokeStyle='#3a6a8c';ctx.strokeRect(-40,-32,80,50);
    txt(c,`${(c.voltage||0).toFixed(1)} V`,0,-18,COL.ok,11,'center',800);txt(c,`${(c.current||0).toFixed(2)} A`,0,-2,COL.warn,10,'center',800);txt(c,`${Math.round(c.watts||0)} W`,0,14,COL.text,10,'center',800);
    txt(c,c.label,0,-44,COL.text,9);txt(c,'AC V/A/W',0,40,COL.mut,8,'center',800);},
  dcvawmeter(c){body(c,100,90,'#2ec4b6');ctx.fillStyle='#071018';ctx.fillRect(-40,-32,80,50);ctx.strokeStyle='#2ec4b6';ctx.strokeRect(-40,-32,80,50);
    txt(c,`${(c.voltage||0).toFixed(1)} V`,0,-18,COL.ok,11,'center',800);txt(c,`${(c.current||0).toFixed(2)} A`,0,-2,COL.warn,10,'center',800);txt(c,`${Math.round(c.watts||0)} W`,0,14,COL.text,10,'center',800);
    txt(c,c.label,0,-44,COL.text,9);txt(c,'DC V/A/W',0,40,COL.mut,8,'center',800);},

  hybrid(c){const on=c.on,bad=/TRIP|LOW|NO SOURCE|INSUFF/.test(c.status||''),col=!on?COL.edge:bad?COL.bad:COL.ok;
    body(c,170,140,col);
    ctx.fillStyle='#1a2a3c';ctx.fillRect(-75,-48,150,96);ctx.strokeStyle=col;ctx.lineWidth=2;ctx.strokeRect(-75,-48,150,96);
    txt(c,'PV',-52,-30,COL.warn,8,'center',800);txt(c,'BAT',-52,28,COL.mut,8,'center',800);
    txt(c,'GRID',-15,-40,COL.mut,8,'center',800);txt(c,'GEN',-15,46,COL.mut,8,'center',800);txt(c,'LOAD',45,-6,COL.mut,8,'center',800);
    txt(c,c.label,0,-60,COL.text,10);
    txt(c,`PV ${Math.round(c.pvW||0)}W`,0,-22,COL.warn,8,'center',800);
    const fr=Math.min(1,(c.loadW||0)/Math.max(1,c.rating||1));
    ctx.fillStyle='#0d1824';ctx.fillRect(-30,-12,70,6);ctx.fillStyle=fr>1?COL.bad:fr>.8?COL.warn:COL.ok;ctx.fillRect(-30,-12,70*fr,6);
    txt(c,`${Math.round(c.loadW||0)} / ${c.rating} W`,5,6,COL.mut,8,'center',800);
    txt(c,c.status||(on?'STANDBY':'OFF'),5,20,on?(bad?COL.bad:COL.ok):COL.mut,8,'center',800);
    txt(c,`Src: ${c._src||'-'}`,5,32,COL.mut,8,'center',800);},
  hybridlfp(c){const on=c.on,bad=/TRIP|LOW|NO SOURCE|INSUFF|BMS/.test(c.status||''),col=!on?COL.edge:bad?COL.bad:COL.ok;
    body(c,180,150,col);ctx.fillStyle='#1a2a3c';ctx.fillRect(-80,-52,160,104);ctx.strokeStyle=col;ctx.lineWidth=2;ctx.strokeRect(-80,-52,160,104);
    txt(c,'LFP HYBRID',0,-64,COL.text,10);txt(c,'PV',-56,-34,COL.warn,8,'center',800);txt(c,'BAT',-56,30,COL.ok,8,'center',800);
    txt(c,'GRID',-12,-44,COL.mut,8,'center',800);txt(c,'GEN',-12,52,COL.mut,8,'center',800);txt(c,'LOAD',50,-8,COL.mut,8,'center',800);
    txt(c,`PV ${Math.round(c.pvW||0)}W`,8,-24,COL.warn,8,'center',800);
    const fr=Math.min(1,(c.loadW||0)/Math.max(1,c.rating||1));ctx.fillStyle='#0d1824';ctx.fillRect(-24,-10,78,6);ctx.fillStyle=fr>1?COL.bad:fr>.8?COL.warn:COL.ok;ctx.fillRect(-24,-10,78*fr,6);
    txt(c,`Load ${Math.round(c.loadW||0)} / ${c.rating} W`,12,8,COL.mut,8,'center',800);
    txt(c,c.status||(on?'STANDBY':'OFF'),12,20,on?(bad?COL.bad:COL.ok):COL.mut,8,'center',800);
    const chg2=Math.round(c._chgW||0);
    txt(c,chg2>5?`CHG ${chg2} W`:`${c.battNom||48}V LFP${c.canOnline?' · BMS OK':''}`,12,34,chg2>5?COL.ok:(c.canOnline?COL.ok:COL.mut),8,'center',800);},
  hybridlfpgt(c){const on=c.on,bad=/TRIP|LOW|NO SOURCE|INSUFF|BMS/.test(c.status||''),col=!on?COL.edge:bad?COL.bad:COL.ok;
    body(c,170,140,col);ctx.fillStyle='#1a2a3c';ctx.fillRect(-75,-48,150,96);ctx.strokeStyle=col;ctx.lineWidth=2;ctx.strokeRect(-75,-48,150,96);
    txt(c,'LFP GRID-TIE',0,-60,COL.text,10);txt(c,'PV',-52,-30,COL.warn,8,'center',800);txt(c,'BAT',-52,28,COL.ok,8,'center',800);
    txt(c,'GRID',-10,-40,COL.mut,8,'center',800);txt(c,'LOAD',48,-6,COL.mut,8,'center',800);
    txt(c,`PV ${Math.round(c.pvW||0)}W`,6,-20,COL.warn,8,'center',800);
    const fr=Math.min(1,(c.loadW||0)/Math.max(1,c.rating||1));ctx.fillStyle='#0d1824';ctx.fillRect(-28,-10,72,6);ctx.fillStyle=fr>1?COL.bad:fr>.8?COL.warn:COL.ok;ctx.fillRect(-28,-10,72*fr,6);
    txt(c,`${Math.round(c.loadW||0)} / ${c.rating} W`,8,8,COL.mut,8,'center',800);
    txt(c,c.status||(on?'STANDBY':'OFF'),8,22,on?(bad?COL.bad:COL.ok):COL.mut,8,'center',800);
    txt(c,c.exportEnable?'EXPORT ON':'NO EXPORT',8,34,c.exportEnable?COL.ok:COL.mut,8,'center',800);},
    hybridbms(c){const on=c.on,bad=/TRIP|LOW|NO SOURCE|INSUFF|BMS|PROTECT/.test(c.status||''),col=!on?COL.edge:bad?COL.bad:COL.ok;
    body(c,190,160,col);ctx.fillStyle='#1a2a3c';ctx.fillRect(-85,-55,170,110);ctx.strokeStyle=col;ctx.lineWidth=2;ctx.strokeRect(-85,-55,170,110);
    txt(c,'LFP + BMS HYBRID',0,-68,COL.text,10);txt(c,'PV',-60,-36,COL.warn,8,'center',800);txt(c,'BAT',-60,28,COL.ok,8,'center',800);
    txt(c,'GRID',-15,-46,COL.mut,8,'center',800);txt(c,'GEN',-15,55,COL.mut,8,'center',800);txt(c,'LOAD',55,-8,COL.mut,8,'center',800);
    txt(c,`PV ${Math.round(c.pvW||0)}W`,10,-26,COL.warn,8,'center',800);
    const fr=Math.min(1,(c.loadW||0)/Math.max(1,c.rating||1));ctx.fillStyle='#0d1824';ctx.fillRect(-28,-12,80,6);ctx.fillStyle=fr>1?COL.bad:fr>.8?COL.warn:COL.ok;ctx.fillRect(-28,-12,80*fr,6);
    txt(c,`Load ${Math.round(c.loadW||0)} / ${c.rating} W`,14,6,COL.mut,8,'center',800);
    txt(c,c.status||(on?'STANDBY':'OFF'),14,18,on?(bad?COL.bad:COL.ok):COL.mut,8,'center',800);
    const chgW=Math.round(c._chgW||0);
    txt(c,chgW>5?`CHG ${chgW} W · BAT`:`BMS ${c.bmsStatus||'OK'} · ${c.battNom||48}V`,14,32,chgW>5?COL.ok:(c.bmsStatus==='OK'?COL.ok:COL.warn),8,'center',800);},
chargecontroller(c){const on=c.on;body(c,120,80,on?COL.ok:COL.edge);
    // Controller body
    ctx.fillStyle='#1a2a3c';ctx.fillRect(-50,-30,100,60);
    ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-50,-30,100,60);
    // MPPT/PWM indicator
    ctx.fillStyle=on?COL.ok:COL.mut;ctx.font='bold 9px Inter,system-ui,sans-serif';ctx.textAlign='center';ctx.fillText((c.mode||'mppt').toUpperCase(),0,-12);
    // Charge stages
    const stages=['BULK','ABSORB','FLOAT'];
    stages.forEach((s,i)=>{const x=-30+i*30;ctx.fillStyle=on?COL.mut:'#3a4a5c';ctx.fillRect(x-12,5,24,16);ctx.strokeStyle='#4a6a8c';ctx.strokeRect(x-12,5,24,16);ctx.fillStyle='#6a8aac';ctx.font='7px Inter,system-ui,sans-serif';ctx.fillText(s,x,15);});
    txt(c,c.label,0,-38,COL.text,9);
    txt(c,on?'ACTIVE':'STANDBY',0,38,on?COL.ok:COL.mut,8,'center',800);},
  batterycharger(c){const active=c.status==='CHARGING'||c.status==='READY';body(c,130,100,active?COL.ok:COL.edge);ctx.fillStyle='#1a2a3c';ctx.fillRect(-48,-35,96,70);ctx.strokeStyle=active?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-48,-35,96,70);txt(c,c.label,0,-43,COL.text,9);txt(c,'AC → DC',0,-10,active?COL.ok:COL.mut,12,'center',800);txt(c,`${Number(c.dcVoltage||0).toFixed(1)} V`,0,7,COL.text,10,'center',800);txt(c,`${Number(c.outputCurrent||0).toFixed(1)} A · ${c.status||'OFFLINE'}`,0,23,active?COL.ok:COL.mut,8,'center',800);},
  ats(c){const active=Number(c._active)||0;body(c,190,150,active?COL.ok:COL.edge);
    ctx.fillStyle='#101d30';ctx.fillRect(-80,-55,160,110);ctx.strokeStyle=active?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-80,-55,160,110);
    for(let i=1;i<=4;i++){const y=-38+(i-1)*25;ctx.strokeStyle=c._healthy&&c._healthy[i-1]?(i===active?COL.ok:COL.warn):COL.off;ctx.lineWidth=i===active?4:2;ctx.beginPath();ctx.moveTo(-75,y);ctx.lineTo(-20, y);ctx.stroke();txt(c,`S${i}`, -55,y-4, c._healthy&&c._healthy[i-1]?COL.text:COL.mut,8,'center',800);}
    ctx.strokeStyle=active?COL.ok:COL.mut;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(72,-15);ctx.moveTo(20,0);ctx.lineTo(72,15);ctx.stroke();
    txt(c,c.label,0,-68,COL.text,10);txt(c,active?`SRC${active} → LOAD`:'NO SOURCE',0,70,active?COL.ok:COL.bad,9,'center',800);
  },

};

/* ───────────── v2: realistic renderers, SVG icons, pump curve ───────────── */
const SV=d=>`<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICON={
source:SV('<circle cx="12" cy="12" r="9" fill="none"/><path d="M8 12c2-5 4-5 6 0s4 5 6 0" stroke-dasharray="2 2"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
mcb:SV('<rect x="5" y="4" width="14" height="16" rx="2" fill="none"/><rect x="9" y="6" width="6" height="6" rx="1" fill="currentColor"/><path d="M8 16h8" stroke-width="2"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/>'),
rcd:SV('<rect x="5" y="4" width="14" height="16" rx="2" fill="none"/><path d="M14 6l-4 7h4l-2 7 5-8h-4z" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/>'),
overload:SV('<rect x="3" y="8" width="18" height="8" rx="2" fill="none"/><path d="M5 12h2l2-4 2.5 8 2.5-8 2 4h2" stroke-width="2"/>'),
float:SV('<path d="M12 2v8" stroke-width="2"/><circle cx="12" cy="13" r="5" fill="none"/><path d="M4 20c3.5 2.5 7-2.5 10.5 0s7 2.5 10.5 0" stroke-width="2"/>'),
contactor:SV('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 4v5M15 4v5M9 20v-5M15 20v-5M9 15l6-6"/>'),
switch:SV('<circle cx="5" cy="16" r="1.6"/><circle cx="19" cy="16" r="1.6"/><path d="M5 16l12-7"/>'),
pb:SV('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4" fill="currentColor"/>'),
motor:SV('<rect x="2" y="8" width="10" height="8" rx="2"/><circle cx="16" cy="12" r="5"/><path d="M16 7V4h5M16 17v3M5 8v8M8 8v8"/>'),
gearpump:SV('<circle cx="8" cy="10" r="4.5"/><circle cx="8" cy="10" r="1.5" fill="currentColor"/><circle cx="16" cy="14" r="4.5"/><circle cx="16" cy="14" r="1.5" fill="currentColor"/><path d="M8 5.5v-2M8 14.5v2M11.5 10h2M16 9.5l1.8-1.8"/>'),
silo:SV('<path d="M7 3h10v3c0 1-2 2-5 2s-5-1-5-2z"/><path d="M8 8v11a4 4 0 0 0 8 0V8"/><path d="M8 8h8"/>'),
silopump:SV('<path d="M7 3h10v3c0 1-2 2-5 2s-5-1-5-2z"/><path d="M8 8v11a4 4 0 0 0 8 0V8"/><path d="M8 8h8"/><circle cx="18" cy="17" r="3"/><path d="M18 14v-2h3"/>'),
lamp:SV('<path d="M9 18h6M10 21h4M8.5 14a5.5 5.5 0 1 1 7 0c-1 1-1.5 1.5-1.5 4h-4c0-2.500-.5-3-1.500-4z"/>'),
junction:SV('<path d="M12 4v16M4 12h16"/><circle cx="12" cy="12" r="2.500" fill="currentColor"/>'),
tank:SV('<path d="M5 6c0-1.500 3-2.500 7-2.500S19 4.500 19 6v12c0 1.500-3 2.500-7 2.500S5 19.500 5 18z"/><path d="M5 11c2 1.500 12 1.500 14 0"/>'),
sump:SV('<path d="M3 8c3-3 6 3 9 0s6 3 9 0M3 13c3-3 6 3 9 0s6 3 9 0M3 18c3-3 6 3 9 0s6 3 9 0"/>'),
tee:SV('<path d="M3 9h18M12 9v11"/>'),
valve:SV('<path d="M4 13l8-5v10zM20 13l-8-5v10z"/><path d="M12 8V4M8 4h8"/>'),
tap:SV('<path d="M3 10h8a4 4 0 0 1 4 4v1M15 15v3M8 6v4M5 6h6"/>'),
gauge:SV('<path d="M4 18a8.500 8.500 0 1 1 16 0"/><path d="M12 18l4-6"/><circle cx="12" cy="18" r="1" fill="currentColor"/>'),
flowmeter:SV('<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 12h7M11 9l3 3-3 3"/>'),
tempgauge:SV('<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>'),
checkvalve:SV('<path d="M3 12h5M16 12h5"/><path d="M8 7l8 5-8 5z"/><path d="M16 7v10"/>'),
reliefvalve:SV('<path d="M3 17h18"/><path d="M12 17v-3M8 14l2-2-2-2 2-2 2-2 2 2"/>'),
pressurecutoff:SV('<circle cx="12" cy="12" r="8"/><path d="M7 7l10 10"/>'),
timer:SV('<circle cx="12" cy="13" r="7"/><path d="M12 9v4l3 2M9 3h6"/>'),
accumulator:SV('<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M7 13h10"/>'),
filter:SV('<path d="M4 5h16l-6 8v6l-4-2v-4z"/>'),
manifold:SV('<path d="M3 12h6M9 5v14M9 6h12M9 12h12M9 18h12"/>'),
solar:SV('<rect x="2" y="6" width="20" height="14" rx="1"/><path d="M4 9h4M10 9h4M16 9h4M4 12h4M10 12h4M16 12h4M4 15h4M10 15h4M16 15h4"/><circle cx="12" cy="3" r="1.5"/>'),
battery:SV('<rect x="6" y="4" width="12" height="16" rx="2"/><rect x="10" y="2" width="4" height="2"/><path d="M8 8h8M8 12h8M8 16h8"/>'),
acmotor:SV('<circle cx="12" cy="12" r="8"/><path d="M8 12h8M12 8v8"/><text x="7" y="14" font-size="5" stroke="none" fill="currentColor">1~</text>'),
dcmotor:SV('<circle cx="12" cy="12" r="8"/><path d="M8 12h8M12 8v8"/><text x="7" y="14" font-size="5" stroke="none" fill="currentColor">DC</text>'),
lfpbattery:SV('<rect x="5" y="5" width="14" height="15" rx="2"/><rect x="9" y="3" width="6" height="2"/><path d="M8 9h8M8 13h8"/><path d="M8 17h4"/>'),
bms:SV('<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 12h8M8 15h5"/><circle cx="17" cy="15" r="1.5"/>'),
hybridlfp:SV('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 12h3l2-4 2 8 2-4h3"/><circle cx="7" cy="8" r="1.4"/>'),
hybridlfpgt:SV('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M6 12h4l2-3 2 6 2-3h4"/><path d="M8 18h8"/>'),
hybridbms:SV('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M6 12h3l2-4 2 8 2-4h3"/><circle cx="17" cy="8" r="1.5"/>'),
acvawmeter:SV('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h7M7 17h4"/>'),
dcvawmeter:SV('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h7"/><path d="M16 16v3M14.5 17.5h3"/>'),
hybrid:SV('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M12 14h7M12 10h7"/>'),
inverter:SV('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 12h4l2-4 2 8 2-4h4"/>'),
chargecontroller:SV('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M6 8h12M6 12h12M6 16h12"/><circle cx="12" cy="20" r="1"/>'),
dcsource:SV('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 9h12M6 15h12"/><circle cx="6" cy="12" r="1"/><circle cx="18" cy="12" r="1"/>'),
generator:SV('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="6"/><path d="M12 6v12M6 12h12"/>'),
transformer:SV('<circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="4"/><path d="M11 6v12"/>'),
wind:SV('<path d="M12 20v-8"/><circle cx="12" cy="10" r="1.5"/><path d="M12 10l-6-5M12 10l6-2M12 10l1 7"/>'),
capacitorbank:SV('<circle cx="7" cy="12" r="3"/><circle cx="12" cy="12" r="3"/><circle cx="17" cy="12" r="3"/>'),
supercap:SV('<rect x="6" y="4" width="12" height="16" rx="2"/><rect x="10" y="2" width="4" height="2"/><path d="M8 8h8"/>'),
fuse:SV('<rect x="4" y="10" width="16" height="4" rx="1"/><path d="M6 12h12"/>'),
spd:SV('<path d="M4 8l8 8 8-8"/><path d="M12 16v6"/>'),
earthrod:SV('<path d="M12 4v14M8 14l4 4 4-4"/>'),
lightning:SV('<path d="M13 2l-5 8h4l-3 10 6-8h-4z"/>'),
relay:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>'),
ssr:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 12h8"/>'),
selector:SV('<circle cx="12" cy="12" r="8"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4"/>'),
transfer:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 12l4-4 4 4"/>'),
disconnect:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 12h6"/>'),
plc:SV('<rect x="3" y="4" width="18" height="16" rx="2"/><rect x="6" y="7" width="12" height="6"/><circle cx="8" cy="16" r="1.5"/><circle cx="12" cy="16" r="1.5"/><circle cx="16" cy="16" r="1.5"/>'),
vfd:SV('<rect x="3" y="4" width="18" height="16" rx="2"/><rect x="6" y="7" width="12" height="5"/><path d="M6 15h4l2-3 2 3 2-3h4"/>'),
softstart:SV('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M6 14q6-8 12 0"/>'),
pid:SV('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M6 12q6-8 12 0"/><circle cx="12" cy="12" r="2"/>'),
ct:SV('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>'),
vt:SV('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>'),
energymeter:SV('<rect x="3" y="4" width="18" height="16" rx="2"/><rect x="6" y="7" width="12" height="8"/><path d="M9 12h6"/>'),
pfccap:SV('<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/>'),
heater:SV('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6 9h12M6 12h12M6 15h12"/>'),
fan:SV('<circle cx="12" cy="12" r="8"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4"/>'),
ledstrip:SV('<rect x="2" y="8" width="20" height="8" rx="2"/><circle cx="5" cy="12" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="13" cy="12" r="1.5"/><circle cx="17" cy="12" r="1.5"/><circle cx="21" cy="12" r="1.5"/>'),
solenoid:SV('<circle cx="12" cy="12" r="8"/><rect x="10" y="6" width="4" height="12"/>'),
gasturbine:SV('<rect x="2" y="5" width="20" height="14" rx="2" fill="none"/><path d="M4 10h16M4 14h16"/><circle cx="12" cy="8" r="2" fill="currentColor"/><path d="M8 8l4-4 4 4-4 0zM16 8l4-4 4 4-4 0z"/><path d="M10 16h4" stroke-width="2"/>'),
steamturbine:SV('<rect x="2" y="5" width="20" height="14" rx="2" fill="none"/><path d="M4 8h4M4 12h4M4 16h4"/><circle cx="16" cy="12" r="4" fill="none"/><path d="M16 8v8M12 12h8" stroke-width="2"/><path d="M12 16h4" stroke-width="2"/>'),
boiler:SV('<rect x="2" y="4" width="20" height="16" rx="2" fill="none"/><path d="M4 8h16M4 12h16M4 16h16" stroke-width="1.5"/><circle cx="12" cy="10" r="3" fill="currentColor"/><path d="M12 14v4"/><rect x="10" y="16" width="4" height="2" fill="currentColor"/>'),
condenser:SV('<rect x="2" y="5" width="20" height="14" rx="2" fill="none"/><path d="M4 8h4M8 8h4M12 8h4M16 8h4M4 12h4M8 12h4M12 12h4M16 12h4M4 16h4M8 16h4M12 16h4M16 16h4" stroke-width="1.5"/>'),
coolingtower:SV('<path d="M4 4l8 16 8-16M8 12v4M6 16l4-8M10 16l4-8M14 16l4-8"/><rect x="10" y="8" width="4" height="8"/>'),
governor:SV('<circle cx="12" cy="12" r="8"/><path d="M12 4v4M12 16v4"/><path d="M8 12h8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
exciter:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 9h8M8 12h8"/><circle cx="12" cy="15" r="2" fill="currentColor"/>'),
syncrelay:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 9h8M8 15h8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
busbar:SV('<rect x="2" y="10" width="20" height="4" rx="1"/>'),
hvbreaker:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 9h8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
transformerhv:SV('<circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="4"/><path d="M11 6v12"/><rect x="10" y="10" width="4" height="4" fill="currentColor"/>'),
reactor:SV('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M8 12h8"/>'),
gascompressor:SV('<rect x="2" y="5" width="20" height="14" rx="2" fill="none"/><circle cx="12" cy="10" r="3" fill="none"/><path d="M12 7v6M9 8l3 2 3-2"/><circle cx="12" cy="16" r="2" fill="currentColor"/>'),
gasvalve:SV('<path d="M4 12h16M8 8l4 4-4 4M16 8l-4 4 4 4" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
gasfilter:SV('<path d="M4 6h16l-5 7v5l-6-2v-3z" fill="none"/><path d="M6 10h12M7 13h10" stroke-width="1.5"/>'),
gasmeter:SV('<rect x="3" y="6" width="18" height="12" rx="2" fill="none"/><circle cx="12" cy="12" r="4" fill="none"/><path d="M12 8v8M8 12h8" stroke-width="1.5"/>'),
pressureregulator:SV('<circle cx="12" cy="12" r="9" fill="none"/><path d="M12 5v4M12 13v6M5 12h14" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>'),
gastank:SV('<path d="M5 7c0-2 3-3 7-3s7 1 7 3v10c0 2-3 3-7 3s-7-1-7-3z" fill="none"/><path d="M5 10h14M5 14h14" stroke-width="1.5"/>'),
gaswell:SV('<path d="M12 4v16M8 8l4-4 4 4"/>'),
naturalgas:SV('<circle cx="12" cy="12" r="8"/><path d="M12 4v4"/>'),
lpgtank:SV('<path d="M5 6c0-1.5 3-2.5 7-2.5S19 4.5 19 6v12c0 1.5-3 2.5-7 2.5S5 19.5 5 18z"/>'),
burner:SV('<circle cx="12" cy="12" r="8"/><path d="M12 4v4"/><path d="M8 10l4 2 4-2"/>'),
combustionchamber:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 10h8"/><circle cx="12" cy="14" r="2" fill="currentColor"/>'),
steamsource:SV('<circle cx="12" cy="12" r="8"/><path d="M12 4v4"/><path d="M8 10l4 2 4-2"/>'),
steamgenerator:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 10h8"/><circle cx="12" cy="14" r="2" fill="currentColor"/>'),
flame:SV('<path d="M12 4v4M8 8l4-4 4 4"/>'),
furnace:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 10h8"/><circle cx="12" cy="14" r="2" fill="currentColor"/>'),
steampipe:SV('<rect x="2" y="10" width="20" height="4" rx="1"/>'),
steamtrap:SV('<path d="M8 12h8M8 16h8"/><circle cx="12" cy="10" r="2" fill="currentColor"/>'),
steamseparator:SV('<circle cx="12" cy="12" r="8"/><path d="M12 4v4"/><path d="M8 8h8M8 16h8"/>'),
feedwaterpump:SV('<rect x="2" y="5" width="20" height="14" rx="2" fill="none"/><circle cx="12" cy="10" r="3" fill="none"/><path d="M12 7v6M9 8l3 2 3-2"/><path d="M4 16h16"/>'),
economizer:SV('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6 9h12M6 13h12"/><path d="M9 8v6M15 8v6"/>'),
superheater:SV('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6 9h12M6 13h12"/><path d="M9 8v6M15 8v6"/>'),
reheater:SV('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6 9h12M6 13h12"/><path d="M9 8v6M15 8v6"/>'),
gatevalve:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 8h8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
globevalve:SV('<circle cx="12" cy="12" r="8"/><path d="M8 8h8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
ballvalve:SV('<circle cx="12" cy="12" r="8"/><path d="M8 8h8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
butterflyvalve:SV('<circle cx="12" cy="12" r="8"/><path d="M8 8h8"/><line x1="12" y1="8" x2="12" y2="16" stroke-width="2"/>'),
expansionjoint:SV('<rect x="2" y="8" width="20" height="8" rx="1"/><path d="M6 8v8M10 8v8M14 8v8M18 8v8"/>'),
flange:SV('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4" fill="none"/><path d="M8 8h8M8 16h8"/>'),
gasket:SV('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4" fill="currentColor"/>'),
pipesupport:SV('<path d="M3 4v16M21 4v16"/><rect x="8" y="6" width="8" height="12" rx="1"/>'),
reducer:SV('<path d="M3 8l8-4v12l-8-4z"/>'),
teejoint:SV('<path d="M3 9h18M12 9v11"/>'),
elbow90:SV('<path d="M12 4v8h8"/>'),
elbow45:SV('<path d="M12 4l6 6"/>'),
avr:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 9h8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
differentialrelay:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 9h8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
overcurrentrelay:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 9h8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
distanceprotection:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 9h8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
synchroscope:SV('<circle cx="12" cy="12" r="8"/><path d="M12 4v4"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
generatorprotection:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 9h8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
deaerator:SV('<path d="M5 6c0-1.5 3-2.5 7-2.5S19 4.5 19 6v12c0 1.5-3 2.5-7 2.5S5 19.5 5 18z"/><path d="M8 10h8"/><path d="M8 14h8"/>'),
lpsystem:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 9h8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
hpsystem:SV('<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 9h8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
feedwatertank:SV('<path d="M5 6c0-1.5 3-2.5 7-2.5S19 4.5 19 6v12c0 1.5-3 2.5-7 2.5S5 19.5 5 18z"/><path d="M8 10h8"/><path d="M8 14h8"/>'),
blowdown:SV('<path d="M8 12h8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
// HVAC components
refrigcylinder:SV('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 3v2"/><circle cx="12" cy="12" r="4"/>'),
filterdrier:SV('<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M8 8h8M8 12h8M8 16h8"/>'),
sightglass:SV('<rect x="5" y="5" width="14" height="14" rx="2"/><circle cx="12" cy="12" r="4"/>'),
receiver:SV('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M6 8h12M6 12h12M6 16h12"/>'),
refrigaccum:SV('<rect x="5" y="5" width="14" height="14" rx="2"/><circle cx="12" cy="12" r="4"/>'),
refrigcompressor:SV('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="8" r="3"/><path d="M12 12v4"/>'),
dxcondenser:SV('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 8h4M10 8h4M14 8h4M6 12h4M10 12h4M14 12h4M6 16h4M10 16h4M14 16h4"/>'),
dxevaporator:SV('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 8h4M10 8h4M14 8h4M6 12h4M10 12h4M14 12h4M6 16h4M10 16h4M14 16h4"/>'),
txv:SV('<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M8 8h8M8 12h8"/>'),
eev:SV('<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M8 8h8M8 12h8"/><circle cx="12" cy="12" r="2"/>'),
reversingvalve:SV('<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M8 8h8M8 12h8"/>'),
liquidsolenoid:SV('<rect x="5" y="5" width="14" height="14" rx="2"/><circle cx="12" cy="12" r="3"/>'),
hpswitch:SV('<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M8 8h8M8 12h8"/>'),
lpswitch:SV('<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M8 8h8M8 12h8"/>'),
chiller:SV('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M6 8h12M6 12h12M6 16h12"/>'),
chwpump:SV('<circle cx="12" cy="12" r="8"/><path d="M12 6v4M12 14v4M6 12h4M14 12h4"/>'),
cwpump:SV('<circle cx="12" cy="12" r="8"/><path d="M12 6v4M12 14v4M6 12h4M14 12h4"/>'),
chwbuffer:SV('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M5 10h14M5 14h14"/>'),
platehx:SV('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 8h12M6 12h12M6 16h12"/>'),
threewayvalve:SV('<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M8 8h8M8 12h8"/>'),
ahu:SV('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M6 8h12M6 12h12M6 16h12"/>'),
fancoil:SV('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 8h12M6 12h12M6 16h12"/>'),
supplyfan:SV('<circle cx="12" cy="12" r="8"/><path d="M12 6v4M12 14v4M6 12h4M14 12h4"/>'),
returnfan:SV('<circle cx="12" cy="12" r="8"/><path d="M12 6v4M12 14v4M6 12h4M14 12h4"/>'),
heatingcoil:SV('<rect x="3" y="8" width="18" height="8"/><path d="M6 8v8M10 8v8M14 8v8M18 8v8"/>'),
coolingcoil:SV('<rect x="3" y="8" width="18" height="8"/><path d="M6 8v8M12 8v8M18 8v8"/>'),
humidifier:SV('<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M12 8v6M9 14c2 2 4 2 6 0"/>'),
damper:SV('<rect x="3" y="8" width="18" height="8"/><path d="M5 16L19 8"/>'),
vavbox:SV('<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M8 12h8"/>'),
duct:SV('<rect x="2" y="9" width="20" height="6" rx="1"/>'),
airfilter:SV('<path d="M4 5h16l-5 7v6l-6-2v-4z"/>'),
freshair:SV('<circle cx="12" cy="12" r="8"/><path d="M12 5v3M8 8l4-3 4 3"/>'),
exhaustair:SV('<circle cx="12" cy="12" r="8"/><path d="M12 19v-3M8 16l4 3 4-3"/>'),
diffuser:SV('<circle cx="12" cy="12" r="8"/><path d="M12 6v12M6 12h12"/>'),
returngrille:SV('<rect x="4" y="6" width="16" height="12"/><path d="M4 10h16M4 14h16"/>'),
airecon:SV('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 9h8M8 15h8"/>'),
hvaczone:SV('<path d="M4 20V10l8-6 8 6v10H4z"/><path d="M10 20v-6h4v6"/>'),
thermostat:SV('<rect x="7" y="3" width="10" height="18" rx="2"/><circle cx="12" cy="14" r="3"/>'),
humidistat:SV('<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M12 8v5"/>'),
freezestat:SV('<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M12 8v6"/>'),
hvacctrl:SV('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 9h12M6 13h8/>')};
const GR=(x0,y0,x1,y1,s)=>{const g=ctx.createLinearGradient(x0,y0,x1,y1);s.forEach(a=>g.addColorStop(a[0],a[1]));return g;};
const metal=(x,y,w,h,r,b)=>{rr(x,y,w,h,r);ctx.fillStyle=GR(x,y,x,y+h,[[0,'#d7e0ea'],[.3,b||'#8396aa'],[.7,'#4b5d71'],[1,'#2c3a4a']]);ctx.fill();ctx.lineWidth=1;ctx.strokeStyle='rgba(0,0,0,.6)';ctx.stroke();};
const brass=(x,y,w,h,r)=>{rr(x,y,w,h,r);ctx.fillStyle=GR(x,y,x,y+h,[[0,'#f2dc8e'],[.35,'#c9a24a'],[.75,'#8a6a22'],[1,'#5c4515']]);ctx.fill();ctx.lineWidth=1;ctx.strokeStyle='rgba(0,0,0,.6)';ctx.stroke();};
const screw=(x,y,r)=>{r=r||2.5;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fillStyle=GR(x-r,y-r,x+r,y+r,[[0,'#eee'],[1,'#667']]);ctx.fill();line([[x-r*.6,y],[x+r*.6,y]],'#333',.8);};
const led=(x,y,col,on)=>{if(on)glow(x,y,11,col+'99');ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fillStyle=on?col:'#2a3442';ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=.8;ctx.stroke();};
const shadow=f=>{ctx.save();ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=10;ctx.shadowOffsetY=4;f();ctx.restore();};
const pipeEnd=(x0,x1,y)=>{ctx.fillStyle=GR(0,y-5,0,y+5,[[0,'#cfe3f2'],[.5,'#6f93b0'],[1,'#2b4660']]);ctx.fillRect(Math.min(x0,x1),y-4.5,Math.abs(x1-x0),9);};
function dial(c,v,max,col,unit,red){const n=c._n=(c._n==null?v:c._n+(v-c._n)*Math.min(1,fdt*5));
  shadow(()=>{ctx.beginPath();ctx.arc(0,0,29,0,7);ctx.fillStyle=GR(-29,-29,29,29,[[0,'#e6edf4'],[.5,'#7b8da1'],[1,'#222d3a']]);ctx.fill();});
  ctx.beginPath();ctx.arc(0,0,25,0,7);ctx.fillStyle='#f4f2ea';ctx.fill();ctx.strokeStyle='#222';ctx.lineWidth=1;ctx.stroke();
  const A=f=>Math.PI*.75+Math.PI*1.5*f;
  if(red!=null){ctx.beginPath();ctx.arc(0,0,21.500,A(red),A(1));ctx.strokeStyle='#d33';ctx.lineWidth=3;ctx.stroke();}
  for(let i=0;i<=20;i++){const a=A(i/20),mj=i%5===0,r1=mj?16:19;line([[Math.cos(a)*r1,Math.sin(a)*r1],[Math.cos(a)*23,Math.sin(a)*23]],'#222',mj?1.4:.7);
    if(mj)txt(c,String(+(max*i/20).toFixed(max<10?1:0)),Math.cos(a)*11,Math.sin(a)*11,'#222',6,'center',700);}
  txt(c,unit,0,13,'#444',6.5,'center',700);
  ctx.save();ctx.rotate(A(Math.max(0,Math.min(1,n/max))));ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(0,-1.5);ctx.lineTo(20,0);ctx.lineTo(0,1.5);ctx.closePath();ctx.fillStyle=col;ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=2;ctx.fill();ctx.restore();
  ctx.beginPath();ctx.arc(0,0,3,0,7);ctx.fillStyle='#222';ctx.fill();
  ctx.beginPath();ctx.arc(0,-8,22,Math.PI*1.1,Math.PI*1.9);ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=5;ctx.stroke();}
Object.assign(DRAW,{
gauge(c){dial(c,c.pressure||0,c.max||10,'#c0392b','bar',.8);txt(c,(c.pressure||0).toFixed(2)+' bar',0,41,COL.text,9,'center',800);txt(c,c.label,0,-39,COL.mut,8);},
tempgauge(c){dial(c,c.temperature||20,c.max||100,'#111','°C',.8);txt(c,(c.temperature||20).toFixed(1)+' °C',0,41,COL.text,9,'center',800);txt(c,c.label,0,-39,COL.mut,8);},
motor(c){const sp=c.spin||0,run=c.powered;ctx.save();ctx.translate(run?Math.sin(NOW*.09)*.5*sp:0,0);
  if(run)glow(0,0,70,'rgba(6,214,160,.12)');
  shadow(()=>metal(-62,40,124,7,2,'#556'));
  line([[-60,-25],[-50,-25]],'#b87333',3);line([[-60,0],[-50,0]],'#b87333',3);line([[0,60],[0,46]],COL.pe,3);
  shadow(()=>{rr(-50,-30,56,60,10);ctx.fillStyle=GR(0,-30,0,30,[[0,'#4aa3d8'],[.25,'#1e6fa3'],[.7,'#0f4570'],[1,'#092c49']]);ctx.fill();});
  for(let i=0;i<8;i++){const x=-44+i*6.2;line([[x,-27],[x,27]],'rgba(0,0,0,.35)',1.6);line([[x+1.5,-27],[x+1.5,27]],'rgba(255,255,255,.12)',.8);}
  rr(-50,-30,56,60,10);ctx.strokeStyle='rgba(0,0,0,.7)';ctx.lineWidth=1.2;ctx.stroke();
  metal(-56,-22,8,44,3,'#667');metal(-30,-40,26,12,2,'#99a');screw(-26,-34,1.8);screw(-8,-34,1.8);
  metal(6,-6,10,12,2,'#aab');pipeEnd(30,60,-25);pipeEnd(30,60,25);metal(54,-31,6,12,1);metal(54,19,6,12,1);
  shadow(()=>{ctx.beginPath();ctx.arc(30,0,28,0,7);ctx.fillStyle=GR(0,-28,0,28,[[0,'#cfd8e2'],[.5,'#8294a8'],[1,'#3a4a5c']]);ctx.fill();});
  ctx.strokeStyle='rgba(0,0,0,.65)';ctx.lineWidth=1.3;ctx.stroke();
  ctx.save();ctx.beginPath();ctx.arc(30,0,20,0,7);ctx.clip();ctx.fillStyle=c._wet?GR(0,-20,0,20,[[0,'#4fb6e8'],[1,'#0b4f8a']]):'#1a2430';ctx.fillRect(10,-20,40,40);
  c.ang=(c.ang||0)+sp*fdt*sim.speed*(sim.running?38:0);ctx.translate(30,0);ctx.rotate(c.ang);
  if(sp>.55){ctx.beginPath();ctx.arc(0,0,19,0,7);ctx.fillStyle='rgba(220,245,255,.22)';ctx.fill();}
  for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(3,0);ctx.quadraticCurveTo(10,-9,19,-5);ctx.strokeStyle=sp>.55?'rgba(255,255,255,.35)':'#dfe9f2';ctx.lineWidth=3;ctx.stroke();}
  ctx.restore();ctx.beginPath();ctx.arc(30,0,4,0,7);ctx.fillStyle='#cfd8e2';ctx.fill();
  ctx.beginPath();ctx.arc(30,0,20,0,7);ctx.strokeStyle='#223';ctx.lineWidth=2;ctx.stroke();
  for(let i=0;i<6;i++){const a=i*Math.PI/3+.5;screw(30+Math.cos(a)*24,Math.sin(a)*24,1.6);}
  led(-38,34,run?COL.ok:COL.bad,run||c.cutout||c.fault==='stall');ctx.restore();
  txt(c,c.label+' · '+c.hp+' HP',0,-52,COL.text,10);
  const s=c.cutout?'CUT-OUT':run?(c.fault==='stall'?'STALLED':sp<.9?'RUN-UP':'RUNNING'):sp>.05?'COASTING':(c.fault==='open'?'OPEN WINDING':'STOPPED');
  txt(c,s,-6,54,run?(c.fault==='stall'?COL.bad:COL.ok):COL.mut,9,'center',800);
  if(run)txt(c,(c.pressure||0).toFixed(1)+' bar',30,-39,COL.warn,8);
  if(c.fault==='earth')txt(c,'⚠ earth leak',0,-62,COL.warn,8);},
tank(c){const W=140,H=180,bot=H/2-10,top=-H/2+16,ih=bot-top,y=bot-ih*c.level/100;
  shadow(()=>{rr(-W/2,-H/2,W,H,14);ctx.fillStyle='#10202f';ctx.fill();});
  ctx.save();rr(-W/2+5,-H/2+5,W-10,H-10,10);ctx.clip();
  ctx.fillStyle=GR(-W/2,0,W/2,0,[[0,'#13283d'],[.5,'#0c1b2b'],[1,'#13283d']]);ctx.fillRect(-W/2,-H/2,W,H);
  const wy=x=>y+Math.sin(x*.07+NOW*.003)*1.8+Math.sin(x*.19-NOW*.005)*.8;
  ctx.fillStyle=GR(0,y,0,bot,[[0,'rgba(86,196,240,.85)'],[.5,'rgba(24,130,196,.9)'],[1,'rgba(4,58,120,.95)']]);
  ctx.beginPath();ctx.moveTo(-W/2,bot+10);for(let x=-W/2;x<=W/2;x+=3)ctx.lineTo(x,wy(x));ctx.lineTo(W/2,bot+10);ctx.fill();
  ctx.beginPath();for(let x=-W/2;x<=W/2;x+=3)x>-W/2?ctx.lineTo(x,wy(x)):ctx.moveTo(x,wy(x));ctx.strokeStyle='rgba(220,248,255,.85)';ctx.lineWidth=1.2;ctx.stroke();
  if((c._in||0)>.0005&&y<62)for(let i=0;i<8;i++){const t=(NOW*.0006*(1+i%3)+i*.37)%1;ctx.beginPath();ctx.arc(-W/2+14+(i*11)%26+Math.sin(t*9+i)*3,62-(62-y)*t,1.4+i%2,0,7);ctx.fillStyle='rgba(255,255,255,.5)';ctx.fill();}
  ctx.fillStyle=GR(-W/2,0,W/2,0,[[0,'rgba(255,255,255,.16)'],[.2,'rgba(255,255,255,0)'],[1,'rgba(255,255,255,.05)']]);ctx.fillRect(-W/2,-H/2,W,H);ctx.restore();
  ctx.lineWidth=2.5;ctx.strokeStyle=c.overflow?COL.bad:'#6f93b3';rr(-W/2,-H/2,W,H,14);ctx.stroke();metal(-W/2-3,-H/2-9,W+6,11,4,'#8aa');
  for(let p=0;p<=100;p+=25){const yy=bot-ih*p/100;line([[W/2-12,yy],[W/2-4,yy]],COL.mut,1);txt(c,p+'%',W/2-16,yy,COL.mut,8,'right');}
  for(const f of comps)if(f.type==='float'&&tankOf(f)===c){const ys=bot-ih*f.stop/100,yr=bot-ih*f.restart/100;
    ctx.setLineDash([4,3]);line([[-W/2+6,ys],[W/2-30,ys]],COL.bad,1);line([[-W/2+6,yr],[W/2-30,yr]],COL.ok,1);ctx.setLineDash([]);
    txt(c,f.label+' stop',-W/2+8,ys-6,COL.bad,7,'left');txt(c,f.label+' restart',-W/2+8,yr-6,COL.ok,7,'left');}
  txt(c,c.label,0,-H/2-16,COL.text,11,'center',800);txt(c,c.level.toFixed(0)+'%',-10,0,'#fff',16,'center',800);txt(c,Math.round(c.level*10)+' L',-10,16,'#cfefff',9,'center',700);
  if((c._in||0)>.0005)txt(c,'▲ filling',0,H/2+12,COL.ok,9,'center',800);
  if(c.overflow){txt(c,'OVERFLOW',0,-H/2+30,COL.bad,10,'center',800);for(let i=0;i<5;i++){const t=(NOW*.001+i*.2)%1;ctx.fillStyle='rgba(120,210,255,.8)';ctx.beginPath();ctx.arc(-W/2+20+i*25,-H/2-2+t*30,2,0,7);ctx.fill();}}},
pressurecutoff(c){const t=c.tripped,k=Math.min(1,(c.pressure||0)/(c.setting||5));
  pipeEnd(-45,-20,0);pipeEnd(20,45,0);shadow(()=>brass(-22,-12,44,24,6));
  metal(-12,-32,24,22,3,'#8a99aa');rr(-8,-29,16,15,2);ctx.fillStyle='#0a141f';ctx.fill();
  ctx.beginPath();for(let i=0;i<6;i++){const yy=-16-i*(2.2-k*.6);ctx.moveTo(-6,yy);ctx.lineTo(6,yy-1.2);}ctx.strokeStyle='#d9dee5';ctx.lineWidth=1.3;ctx.stroke();
  led(17,-22,t?COL.bad:COL.ok,true);
  ctx.beginPath();ctx.arc(0,0,6,0,7);ctx.fillStyle=t?COL.bad:'#2c9';ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.stroke();
  if(t){line([[-3.500,-3.500],[3.500,3.500]],'#fff',2);line([[3.500,-3.500],[-3.500,3.500]],'#fff',2);}
  txt(c,c.label+' · '+(c.setting||5).toFixed(1)+' bar',0,22,COL.text,8,'center',800);txt(c,t?'TRIPPED – SUPPLY ISOLATED':'OPEN',0,32,t?COL.bad:COL.ok,7,'center',800);},
timer(c){shadow(()=>metal(-52,-46,104,92,6,'#6a7b8e'));rr(-46,-40,92,80,4);ctx.fillStyle='#202a36';ctx.fill();
  for(const y of[-20,20])line([[-60,y],[-46,y]],'#b87333',3);for(const y of[-25,0,25])line([[46,y],[60,y]],'#b87333',3);
  const lit=c.coilOn||c.output,v=(c.output||c.elapsed>0)?(c.remaining||0):Number(c.delay)||0;
  rr(-38,-35,76,36,3);ctx.fillStyle=lit?'#1c3d28':'#10201a';ctx.fill();ctx.strokeStyle='#040';ctx.lineWidth=1;ctx.stroke();
  txt(c,String(v.toFixed(1)).padStart(5,'0')+'s',0,-21,lit?'#7CFFB2':'#2f5a42',17,'center',800);
  txt(c,String(c.mode||'on-delay').toUpperCase(),0,-6,lit?'#7CFFB2':'#2f5a42',7,'center',700);
  const pr=(Number(c.delay)>0?Math.min(1,(c.elapsed||0)/Number(c.delay)):0);rr(-34,-1,68,3,1);ctx.fillStyle='#0a150f';ctx.fill();if(pr>0){rr(-34,-1,68*pr,3,1);ctx.fillStyle='#7CFFB2';ctx.fill();}
  led(-30,14,COL.ok,c.coilOn);led(-10,14,COL.warn,c.output);txt(c,'PWR',-30,24,COL.mut,6);txt(c,'OUT',-10,24,COL.mut,6);
  ctx.save();ctx.translate(28,18);ctx.beginPath();ctx.arc(0,0,10,0,7);ctx.fillStyle=GR(-8,-8,8,8,[[0,'#ddd'],[1,'#556']]);ctx.fill();ctx.rotate(-2+Math.min(1,(Number(c.delay)||0)/60)*4);line([[0,0],[0,-9]],'#111',2);ctx.restore();
  txt(c,c.output?'COM–NO closed':'COM–NC closed',0,34,c.output?COL.ok:COL.warn,7,'center',700);txt(c,c.label,0,-56,COL.text,10);},
pb(c){line([[-35,0],[-18,0]],'#b87333',3);line([[18,0],[35,0]],'#b87333',3);metal(-18,-18,36,36,6,'#5c6d80');
  const d=c.pressed?1.5:0;ctx.beginPath();ctx.arc(0,d,13,0,7);ctx.fillStyle=GR(-8,-10+d,8,12+d,c.nc?(c.pressed?[[0,'#a33'],[1,'#611']]:[[0,'#ff7084'],[1,'#c01a36']]):(c.pressed?[[0,'#2a9'],[1,'#064']]:[[0,'#5fffc4'],[1,'#0a9a6a']]));ctx.fill();ctx.strokeStyle='rgba(0,0,0,.6)';ctx.stroke();
  txt(c,c.label+(c.nc?' NC':' NO'),0,-30,COL.text,10);}
});
const chrome=(x,y,w,h,r)=>{rr(x,y,w,h,r);ctx.fillStyle=GR(x,y,x,y+h,[[0,'#ffffff'],[.3,'#c9d3dc'],[.6,'#7e8c9a'],[1,'#d5dde5']]);ctx.fill();ctx.lineWidth=.8;ctx.strokeStyle='rgba(0,0,0,.55)';ctx.stroke();};
Object.assign(DRAW,{
valve(c){const f=Math.max(0,Math.min(100,c.flowPercent??25))/100,o=c.open&&f>0,fl=sim.hu&&sim.hflow.has(sim.hu.find(key(c.id,'a')));
  pipeEnd(-30,-17,0);pipeEnd(17,30,0);if(fl)glow(0,0,30,'rgba(89,195,255,.22)');
  for(const x of[-18,18])brass(x-3,-9,6,18,1);
  shadow(()=>{ctx.beginPath();ctx.ellipse(0,0,15,11,0,0,7);ctx.fillStyle=GR(0,-11,0,11,[[0,'#f6e3a0'],[.35,'#c9a24a'],[.75,'#8a6a22'],[1,'#4e3a10']]);ctx.fill();});
  ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1;ctx.stroke();
  ctx.beginPath();ctx.moveTo(-6,3);ctx.lineTo(3,3);ctx.lineTo(3,0);ctx.lineTo(9,5.5);ctx.lineTo(3,9);ctx.lineTo(3,8);ctx.lineTo(-6,8);ctx.closePath();ctx.fillStyle='rgba(60,40,5,.45)';ctx.fill();
  brass(-6,-19,12,9,2);brass(-8,-22,16,4,1);line([[0,-22],[0,-26-4*f]],'#dde',3);
  ctx.save();ctx.translate(0,-30-3*f);ctx.scale(1,.42);ctx.beginPath();ctx.arc(0,0,14,0,7);ctx.fillStyle=GR(-14,-14,14,14,o?[[0,'#ff6b6b'],[1,'#a31620']]:[[0,'#a84a4a'],[1,'#541015']]);ctx.fill();ctx.strokeStyle='#300';ctx.lineWidth=1.5;ctx.stroke();
  ctx.rotate(f*Math.PI*6);for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);line([[0,0],[12,0]],'#f1f1f1',2.2);}ctx.beginPath();ctx.arc(0,0,3.5,0,7);ctx.fillStyle='#ccd';ctx.fill();ctx.restore();
  rr(-14,15,28,4,2);ctx.fillStyle='#0a141f';ctx.fill();if(f>0){rr(-14,15,28*f,4,2);ctx.fillStyle=o?COL.ok:COL.bad;ctx.fill();}
  txt(c,c.label+' '+Math.round(f*100)+'%',0,27,o?COL.ok:COL.bad,8,'center',800);},
contactor(c){const on=c.coilOn||c.fault==='weld';c._a=(c._a==null?(on?1:0):c._a+((on?1:0)-c._a)*Math.min(1,fdt*14));const a=c._a;
  shadow(()=>{rr(-64,-54,128,108,7);ctx.fillStyle=GR(-64,0,64,0,[[0,'#2b333f'],[.5,'#3b4553'],[1,'#252c37']]);ctx.fill();});ctx.strokeStyle='#000';ctx.lineWidth=1.2;ctx.stroke();
  for(const y of[-54,42]){rr(-46,y,92,12,2);ctx.fillStyle=GR(0,y,0,y+12,[[0,'#9aa6b6'],[1,'#4a5564']]);ctx.fill();ctx.lineWidth=.8;ctx.stroke();}
  rr(-46,-38,88,76,3);ctx.fillStyle='#0b1118';ctx.fill();rr(-62,-30,14,60,2);ctx.fill();rr(44,-38,18,76,3);ctx.fill();
  for(const x of[-30,30]){line([[x,-60],[x,-54]],'#b87333',3);line([[x,54],[x,60]],'#b87333',3);screw(x,-48,3.2);screw(x,48,3.2);
    line([[x,-42],[x,-30]],'#b87333',2.5);line([[x,30],[x,42]],'#b87333',2.5);
    for(const y of[-30,30]){ctx.beginPath();ctx.arc(x,y,3.5,0,7);ctx.fillStyle=GR(x-3,y-3,x+3,y+3,[[0,'#ffd9a0'],[1,'#a8581c']]);ctx.fill();}
    if(on){line([[x,-30],[x,30]],COL.ok,3.5);glow(x,0,18,'rgba(6,214,160,.25)');}else{line([[x,-30],[x,-8]],COL.bad,3);line([[x,30],[x,8]],'#5b3a3a',1.5);}}
  const cy=-9*(1-a);rr(-40,cy-3,80,6,2);ctx.fillStyle=GR(0,cy-3,0,cy+3,[[0,'#8d99a8'],[1,'#3d4756']]);ctx.fill();
  line([[-70,-20],[-55,-20],[-55,-8]],'#b87333',2.5);line([[-70,20],[-55,20],[-55,8]],'#b87333',2.5);if(on)line([[-55,-8],[-55,8]],COL.ok,3);else line([[-55,-8],[-48,5]],COL.bad,3);
  if(c.coilOn)glow(52,0,32,'rgba(6,214,160,.5)');ctx.beginPath();ctx.arc(52,0,9,0,7);ctx.fillStyle='#0c1a2a';ctx.fill();ctx.strokeStyle=c.coilOn?COL.ok:COL.edge;ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();for(let i=0;i<4;i++){ctx.moveTo(46,-4+i*2.7);ctx.lineTo(58,-4+i*2.7);}ctx.strokeStyle=c.coilOn?COL.ok:'#566';ctx.lineWidth=1;ctx.stroke();
  line([[70,-20],[62,-20],[62,-9]],'#b87333',2.5);line([[70,20],[62,20],[62,9]],'#b87333',2.5);led(53,-28,COL.ok,c.coilOn);
  txt(c,c.label+' · UKC1-12',0,-72,COL.text,10);
  txt(c,c.fault==='weld'?'CONTACTS WELDED':c.fault==='coilopen'?'COIL OPEN':(c.coilOn?'CLOSED':'OPEN'),0,25,c.fault!=='none'?COL.bad:c.coilOn?COL.ok:COL.mut,8,'center',800);},
mcb(c){const rcd=c.type==='rcd',up=c.closed&&!c.tripped,tr=c.tripped;
  shadow(()=>{rr(-26,-38,52,76,5);ctx.fillStyle=GR(-26,0,26,0,[[0,'#cfd5dc'],[.12,'#f5f7f9'],[.88,'#e4e8ec'],[1,'#a9b1bb']]);ctx.fill();});ctx.strokeStyle='#4a525c';ctx.lineWidth=1;ctx.stroke();
  rr(-26,31,52,7,2);ctx.fillStyle='#2b313a';ctx.fill();
  rr(-22,-34,44,13,2);ctx.fillStyle=rcd?'#f2c230':'#fff';ctx.fill();ctx.strokeStyle='#999';ctx.lineWidth=.6;ctx.stroke();
  txt(c,rcd?'RCD '+c.ma+' mA':'C'+c.rating+'  6 kA',0,-27.500,'#111',7.500,'center',800);
  for(const y of[-20,20]){line([[-40,y],[-30,y]],'#b87333',3);line([[30,y],[40,y]],'#b87333',3);
    for(const x of[-33,25]){rr(x,y-6,8,12,1.500);ctx.fillStyle=GR(x,y,x+8,y,[[0,'#e8a56a'],[1,'#9a5a22']]);ctx.fill();}screw(-29,y,2);screw(29,y,2);
    if(up)line([[-26,y],[26,y]],'rgba(6,214,160,.85)',2);}
  rr(-11,-17,22,46,4);ctx.fillStyle='#12161b';ctx.fill();
  const ly=up?-15:tr?-3:9;rr(-9,ly,18,20,3);ctx.fillStyle=GR(-9,0,9,0,[[0,'#20252c'],[.5,'#4a525e'],[1,'#1a1e24']]);ctx.fill();
  for(let i=0;i<3;i++)line([[-6,ly+4+i*4],[6,ly+4+i*4]],'#0c0f12',1);
  rr(-9,up?ly+14:ly,18,6,2);ctx.fillStyle=up?'#e0242a':tr?'#ff9f1c':'#1bb76e';ctx.fill();
  if(rcd){ctx.beginPath();ctx.arc(18,-9,4,0,7);ctx.fillStyle='#333';ctx.fill();txt(c,'T',18,-9,'#ddd',5,'center',800);}
  txt(c,c.label+(tr?' ⚠ TRIPPED':''),0,-48,tr?COL.bad:COL.text,10);},
tap(c){const run=c.running,op=c.open;
  pipeEnd(-30,-6,0);shadow(()=>chrome(-6,-7,22,14,5));
  line([[10,0],[18,0],[20,4],[20,12]],'#6f7f8f',9);line([[10,0],[18,0],[20,4],[20,12]],'#dfe7ee',6);line([[9,-1.500],[17,-1.500]],'rgba(255,255,255,.9)',1.5);chrome(16,12,8,5,1);
  chrome(-3,-13,6,7,1);ctx.save();ctx.translate(0,-16);ctx.rotate(op?Math.PI/2:0);chrome(-9,-2.500,18,5,2.500);ctx.restore();
  ctx.beginPath();ctx.arc(0,-16,2.200,0,7);ctx.fillStyle=op?'#2b7de9':'#d33';ctx.fill();
  if(run){line([[20,17],[20,36]],'rgba(120,205,255,.85)',3);ctx.setLineDash([3,5]);ctx.lineDashOffset=-NOW*.05;line([[20,17],[20,36]],'#fff',1.2);ctx.setLineDash([]);
    for(let i=0;i<2;i++){const t=((NOW*.002)+i/2)%1;ctx.beginPath();ctx.ellipse(20,38,3+t*10,1+t*3,0,0,7);ctx.strokeStyle='rgba(150,220,255,'+((1-t)*.7)+')';ctx.lineWidth=1;ctx.stroke();}}
  txt(c,c.label+(op?'':' (closed)'),0,-32,COL.text,10);},
float(c){const pos=floatPos(c),ye=pos==='NC'?-20:20;c._b=(c._b==null?ye:c._b+(ye-c._b)*Math.min(1,fdt*10));c._f=(c._f==null?(c.up?1:0):c._f+((c.up?1:0)-c._f)*Math.min(1,fdt*4));const f=c._f;
  shadow(()=>metal(-32,-36,64,52,6,'#445566'));rr(-27,-31,54,40,3);ctx.fillStyle='#0e1822';ctx.fill();
  for(const q of[[-45,-24,0],[24,45,-20],[24,45,20]])line([[q[0],q[2]],[q[1],q[2]]],'#b87333',3);
  line([[-24,0],[24,c._b]],COL.ok,3);ctx.beginPath();ctx.arc(-24,0,2.500,0,7);ctx.fillStyle='#ddd';ctx.fill();
  for(const y of[-20,20]){ctx.beginPath();ctx.arc(24,y,2.500,0,7);ctx.fillStyle='#e8a56a';ctx.fill();}
  txt(c,'NC',15,-27,COL.mut,6);txt(c,'NO',15,27,COL.mut,6);metal(-6,14,12,8,2,'#556');
  ctx.save();ctx.translate(0,22);ctx.rotate(-f*1.15);line([[0,0],[0,12]],'#222',2.5);
  ctx.beginPath();ctx.ellipse(0,26,9,15,0,0,7);ctx.fillStyle=GR(-9,0,9,0,c.up?[[0,'#ffb347'],[.5,'#f08a1b'],[1,'#a85208']]:[[0,'#6fb7ff'],[.5,'#2a79c9'],[1,'#123f75']]);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1;ctx.stroke();
  ctx.beginPath();ctx.ellipse(-3,20,2.5,6,0,0,7);ctx.fillStyle='rgba(255,255,255,.4)';ctx.fill();ctx.restore();
  txt(c,c.label+' · '+(c.up?'UP':'DOWN'),0,-46,COL.text,10);},
});
const BRS=[[0,'#f6e3a0'],[.35,'#c9a24a'],[.75,'#8a6a22'],[1,'#4e3a10']];
Object.assign(DRAW,{
checkvalve(c){const tg=c.open?Math.min(1,.35+(c.flow||0)*30):0,o=c._o=(c._o==null?0:c._o+(tg-c._o)*Math.min(1,fdt*8));
  pipeEnd(-30,-16,0);pipeEnd(16,30,0);if(c.open)glow(0,0,30,'rgba(89,195,255,.2)');for(const x of[-17,17])brass(x-3,-12,6,24,1);
  shadow(()=>{rr(-15,-13,30,26,6);ctx.fillStyle=GR(0,-13,0,13,BRS);ctx.fill();});ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1;ctx.stroke();
  rr(-10,-9,20,18,3);ctx.fillStyle=c.open?'#0d3552':'#07121c';ctx.fill();
  line([[3,-9],[3,-4]],'#aab',2.5);line([[3,4],[3,9]],'#aab',2.5);
  ctx.save();ctx.translate(3,-8);ctx.rotate(-o*1.05);line([[0,0],[0,15]],c.open?'#4ade80':'#e5484d',3.5);ctx.beginPath();ctx.ellipse(0,11,3.5,5,0,0,7);ctx.fillStyle=c.open?'#9af2b8':'#ff8a8f';ctx.fill();ctx.restore();
  ctx.beginPath();ctx.arc(3,-8,2,0,7);ctx.fillStyle='#ddd';ctx.fill();
  ctx.beginPath();ctx.moveTo(-9,17);ctx.lineTo(-3,17);ctx.lineTo(-3,15);ctx.lineTo(2,18.500);ctx.lineTo(-3,22);ctx.lineTo(-3,20);ctx.lineTo(-9,20);ctx.closePath();ctx.fillStyle='rgba(255,255,255,.35)';ctx.fill();
  txt(c,c.label+' · '+(c.open?'FORWARD':'BLOCKED'),0,-24,c.open?COL.ok:COL.mut,8,'center',800);},
reliefvalve(c){const o=c.open,k=c._k=(c._k==null?0:c._k+((o?1:0)-c._k)*Math.min(1,fdt*10));
  pipeEnd(-35,-14,0);pipeEnd(14,35,0);brass(-20,-9,5,18,1);brass(15,-9,5,18,1);
  shadow(()=>{rr(-16,-11,32,22,5);ctx.fillStyle=GR(0,-11,0,11,BRS);ctx.fill();});ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1;ctx.stroke();
  rr(-11,-7,22,15,3);ctx.fillStyle=o?'#0d3552':'#07121c';ctx.fill();
  brass(-9,-27,18,17,3);rr(-6,-25,12,13,2);ctx.fillStyle='#07121c';ctx.fill();
  ctx.beginPath();for(let i=0;i<=6;i++){ctx.lineTo(i%2?-(5+k*1.500):5+k*1.500,-12-i*(11/6)*(1-.2*k));}ctx.strokeStyle='#dfe4ea';ctx.lineWidth=1.4;ctx.stroke();
  const dy=-3-k*4;line([[0,dy],[0,-12]],'#aab',2);rr(-7,dy,14,4,1.500);ctx.fillStyle=o?COL.warn:'#d9dee5';ctx.fill();
  rr(-8,-33,16,7,2);ctx.fillStyle=GR(-8,0,8,0,[[0,'#e0574a'],[.5,'#ff8a7a'],[1,'#8f2018']]);ctx.fill();ctx.strokeStyle='#400';ctx.lineWidth=.8;ctx.stroke();brass(-5,-28,10,3,1);
  if(o)for(let i=0;i<6;i++){const t=(NOW*.003+i/6)%1;ctx.beginPath();ctx.arc(19+t*18,-1+t*t*16,1.6,0,7);ctx.fillStyle='rgba(150,220,255,'+(1-t*.6)+')';ctx.fill();}
  txt(c,(c.setting||5).toFixed(1)+' bar',0,21,COL.text,8,'center',800);txt(c,o?'RELIEVING':'SET',0,31,o?COL.warn:COL.mut,7,'center',800);txt(c,c.label,0,-42,COL.text,9);},
lamp(c){const p=c.powered,fl=p?1+Math.sin(NOW*.05)*.03:1;
  if(p){glow(0,-6,70,'rgba(255,214,102,.6)');glow(0,-6,34,'rgba(255,240,180,.7)');}
  line([[0,-30],[0,-22]],'#b87333',3);line([[0,26],[0,30]],'#b87333',3);
  ctx.beginPath();ctx.moveTo(-5,10);ctx.bezierCurveTo(-6,6,-15,2,-15,-6);ctx.arc(0,-6,15,Math.PI,0);ctx.bezierCurveTo(15,2,6,6,5,10);ctx.closePath();
  const g=ctx.createRadialGradient(-4,-10,2,0,-6,17);if(p){g.addColorStop(0,'#fffef0');g.addColorStop(.6,'#ffe08a');g.addColorStop(1,'#ffb52e');}else{g.addColorStop(0,'rgba(240,248,252,.55)');g.addColorStop(1,'rgba(120,145,165,.6)');}
  ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1.2;ctx.stroke();
  line([[-3,10],[-3,-1]],'#888',1);line([[3,10],[3,-1]],'#888',1);
  if(c.fault==='open'){line([[-3,-1],[-1,-4]],'#555',1.5);line([[1,-5],[3,-1]],'#555',1.5);}
  else{ctx.beginPath();for(let i=0;i<7;i++)ctx.lineTo(-3+i,-1-(i%2)*3.5*fl);ctx.strokeStyle=p?'#fff8d0':'#666';ctx.lineWidth=1.6;ctx.stroke();if(p)glow(0,-3,14,'rgba(255,255,255,.95)');}
  ctx.beginPath();ctx.ellipse(-7,-12,2.5,6,.5,0,7);ctx.fillStyle='rgba(255,255,255,.45)';ctx.fill();
  rr(-6,10,12,16,2);ctx.fillStyle=GR(-6,0,6,0,[[0,'#8d99a6'],[.5,'#e3e9ef'],[1,'#6a7683']]);ctx.fill();ctx.strokeStyle='#333';ctx.lineWidth=.8;ctx.stroke();for(let i=0;i<3;i++)line([[-6,13+i*4],[6,13+i*4]],'rgba(0,0,0,.4)',1);
  ctx.beginPath();ctx.arc(0,26,3,0,7);ctx.fillStyle='#222';ctx.fill();
  txt(c,c.label,-26,-4,COL.text,9,'center',700);txt(c,(c.watts||60)+' W',26,6,p?COL.warn:COL.mut,8,'center',700);},
manifold(c){const act=!!c.flowing;pipeEnd(-50,-12,0);pipeEnd(-12,10,0);if(act)glow(18,0,44,'rgba(89,195,255,.2)');
  shadow(()=>{rr(10,-30,16,60,4);ctx.fillStyle=GR(10,0,26,0,[[0,'#f6e3a0'],[.4,'#c9a24a'],[1,'#5c4515']]);ctx.fill();});ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1;ctx.stroke();
  brass(-22,-8,6,16,1);
  [-20,0,20].forEach((y,i)=>{const t='OUT'+(i+1),op=c['o'+(i+1)]!==false,cn=op&&wires.some(w=>!w.broken&&((w.a.c===c.id&&w.a.t===t)||(w.b.c===c.id&&w.b.t===t))),fl=act&&cn,q=(c._outF||[])[i]||0;
    pipeEnd(26,50,y);brass(33,y-6,6,12,1);
    const hc=!op?'#3a4450':!cn?'#7a8794':fl?COL.ok:COL.neu;if(cn)line([[36,y-6],[45,y-6]],hc,2.500);else line([[36,y-6],[36,y-10]],hc,2.500);
    ctx.beginPath();ctx.arc(cn?46:36,cn?y-6:y-11,2,0,7);ctx.fillStyle=hc;ctx.fill();
    ctx.beginPath();ctx.arc(18,y,2.200,0,7);ctx.fillStyle=!op?'#3a4450':fl?'#bfeaff':'#6b5a2a';ctx.fill();});
  led(18,-36,act?COL.ok:COL.off,act);
  txt(c,c.label+' · '+(c.connectedOutlets||0)+'/3 OUT',0,-45,COL.text,8,'center',800);txt(c,(c.pressure||0).toFixed(1)+' bar'+(c._outF?(' · '+c._outF.map(q=>(q*100).toFixed(0)+'%').join('/')):''),-2,36,COL.mut,8,'center',700);},
switch(c){const on=c.closed,s=c._s=(c._s==null?(on?1:0):c._s+((on?1:0)-c._s)*Math.min(1,fdt*14));
  line([[-40,0],[-26,0]],'#b87333',3);line([[26,0],[40,0]],'#b87333',3);
  shadow(()=>{rr(-26,-17,52,34,6);ctx.fillStyle=GR(0,-17,0,17,[[0,'#4a5361'],[1,'#1b2028']]);ctx.fill();});ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.stroke();
  screw(-21,0,3);screw(21,0,3);if(on)line([[-21,14],[21,14]],COL.ok,1.500);
  rr(-14,-13,28,26,4);ctx.fillStyle='#0d1015';ctx.fill();
  if(on)glow(0,0,22,'rgba(255,150,40,.35)');
  ctx.save();ctx.transform(1,(s-.5)*.28,0,1,0,0);rr(-11,-10,22,20,3);ctx.fillStyle=GR(-11,0,11,0,on?[[0,'#ffb35c'],[1,'#c2410c']]:[[0,'#9aa3ad'],[1,'#3d444d']]);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=.8;ctx.stroke();
  if(on)line([[0,-5],[0,5]],'#fff',2.200);else{ctx.beginPath();ctx.arc(0,0,4,0,7);ctx.strokeStyle='#222';ctx.lineWidth=1.800;ctx.stroke();}ctx.restore();
  txt(c,c.label,0,-28,COL.text,10);txt(c,on?'ON':'OFF',0,27,on?COL.ok:COL.mut,8,'center',800);},
// New electrical components drawing functions
dcsource(c){const on=c.on;body(c,100,80,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-30,80,60);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-30,80,60);
  txt(c,c.label,0,-38,COL.text,10);
  txt(c,`${c.volts}V DC`,0,0,on?COL.ok:COL.mut,11,'center',800);
  txt(c,`${c.current}A`,0,14,COL.mut,9,'center',800);},
generator(c){const on=c.on;body(c,140,100,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-60,-40,120,80);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-60,-40,120,80);
  if(on){for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*25,Math.sin(a)*25);ctx.lineTo(Math.cos(a)*35,Math.sin(a)*35);ctx.strokeStyle=COL.ok;ctx.lineWidth=2;ctx.stroke();}}
  txt(c,c.label,0,-48,COL.text,10);
  txt(c,`${c.kva}kVA`,0,0,on?COL.ok:COL.mut,11,'center',800);
  txt(c,`Fuel: ${c.fuel.toFixed(0)}%`,0,14,on?COL.warn:COL.mut,9,'center',800);},
transformer(c){body(c,120,100,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-50,-40,100,80);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-50,-40,100,80);
  ctx.beginPath();ctx.arc(-25,0,20,0,7);ctx.strokeStyle='#b87333';ctx.lineWidth=3;ctx.stroke();
  ctx.beginPath();ctx.arc(25,0,20,0,7);ctx.strokeStyle='#b87333';ctx.lineWidth=3;ctx.stroke();
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=4;ctx.strokeRect(-15,-25,30,50);
  txt(c,c.label,0,-48,COL.text,9);
  txt(c,`${c.priVolts}→${c.secVolts}V`,0,52,COL.mut,8,'center',800);},
wind(c){
  const inst=c._instWind!=null?c._instWind:(c.windSpeed||0);
  const gen=(c.outputPower||0)>5;
  const fault=c.fault&&c.fault!=='none';
  const nearCut=inst>(c.cutOut||25)-3;
  const col=fault?COL.bad:gen?(nearCut?COL.warn:COL.ok):COL.edge;
  body(c,130,170,col);

  // Base / foundation
  ctx.fillStyle='#1a2330';ctx.fillRect(-16,52,32,16);
  ctx.strokeStyle='#3a4a5c';ctx.lineWidth=1;ctx.strokeRect(-16,52,32,16);

  // Tower (slight sway when spinning)
  const sway=gen?Math.sin(NOW*0.004)*0.6:0;
  ctx.save();ctx.translate(sway,0);
  ctx.beginPath();ctx.moveTo(-5,52);ctx.lineTo(-2.5,-22);ctx.lineTo(2.5,-22);ctx.lineTo(5,52);ctx.closePath();
  const tg=ctx.createLinearGradient(-5,0,5,0);tg.addColorStop(0,'#4a5a6c');tg.addColorStop(0.5,'#8a9aac');tg.addColorStop(1,'#3a4a5c');
  ctx.fillStyle=tg;ctx.fill();ctx.strokeStyle='#2a3545';ctx.lineWidth=1;ctx.stroke();
  ctx.restore();

  // Nacelle
  ctx.save();ctx.translate(sway,-28);
  ctx.fillStyle='#2a3548';ctx.beginPath();ctx.ellipse(0,0,16,9,0,0,7);ctx.fill();
  ctx.fillStyle='#3a4a60';ctx.fillRect(-12,-7,24,12);
  ctx.strokeStyle='#1a2535';ctx.lineWidth=1.2;ctx.strokeRect(-12,-7,24,12);
  ctx.fillStyle='#1e2a38';ctx.fillRect(5,-4,9,8);
  ctx.strokeStyle=gen?COL.ok:'#4a5a6c';ctx.lineWidth=1;ctx.strokeRect(5,-4,9,8);

  // Hub + blades (spin from calculated RPM)
  ctx.beginPath();ctx.arc(-9,0,4.5,0,7);ctx.fillStyle='#c0c8d0';ctx.fill();ctx.strokeStyle='#606870';ctx.lineWidth=1;ctx.stroke();
  const rpm=Math.max(0,c.rpm||0);
  // Cap delta so a stalled frame never jumps the angle wildly
  const dAng=Math.min(0.8,(rpm/60)*2*Math.PI*DT()*sim.speed);
  c.ang=(c.ang||0)+dAng;
  ctx.save();ctx.translate(-9,0);ctx.rotate(c.ang);
  // Motion blur ghost blades when spinning fast
  if(rpm>80){
    ctx.globalAlpha=0.18;
    ctx.rotate(-dAng*2);
    for(let i=0;i<3;i++){
      ctx.rotate(Math.PI*2/3);
      ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-3,-6,-5,-22,-1,-42);ctx.bezierCurveTo(2,-44,4,-24,2,-6);ctx.closePath();
      ctx.fillStyle='#c0ccd8';ctx.fill();
    }
    ctx.rotate(dAng*2);ctx.globalAlpha=1;
  }
  for(let i=0;i<3;i++){
    ctx.rotate(Math.PI*2/3);
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.bezierCurveTo(-3.5,-7,-5.5,-22,-1.5,-44);
    ctx.bezierCurveTo(1.5,-46,4.5,-24,2.5,-7);
    ctx.closePath();
    const bg=ctx.createLinearGradient(0,0,0,-44);
    if(fault&&c.fault==='blade'){bg.addColorStop(0,'#6a3030');bg.addColorStop(1,'#3a1818');}
    else{bg.addColorStop(0,'#e8eef4');bg.addColorStop(0.4,'#c0ccd8');bg.addColorStop(1,'#8a9aac');}
    ctx.fillStyle=bg;ctx.fill();
    ctx.strokeStyle=gen?'#a0b0c0':'#607080';ctx.lineWidth=1;ctx.stroke();
  }
  ctx.restore();
  ctx.restore();

  // Wind particle streaks when generating
  if(gen&&inst>2){
    const n=Math.min(8,Math.floor(inst));
    for(let i=0;i<n;i++){
      const t=((NOW*0.001*(0.4+inst*0.05))+i*0.17)%1;
      const x=-55+t*110,y=-70+((i*17)%50);
      ctx.strokeStyle=`rgba(180,210,255,${0.15+0.35*(1-t)})`;
      ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+6+inst*0.4,y);ctx.stroke();
    }
  }

  if(gen){ctx.beginPath();ctx.arc(sway,-28,20,0,7);ctx.strokeStyle='rgba(6,214,160,0.22)';ctx.lineWidth=2.5;ctx.stroke();}

  txt(c,c.label,0,-82,COL.text,10);
  txt(c,`${inst.toFixed(1)} m/s`,0,74,gen?COL.ok:COL.mut,10,'center',800);
  txt(c,`${(c.outputPower||0).toFixed(0)} W`,0,88,gen?COL.ok:COL.mut,9,'center',800);
  if(rpm>5)txt(c,`${Math.round(rpm)} rpm`,0,100,COL.mut,8,'center',700);
  if(fault)txt(c,(c.fault||'').toUpperCase(),0,-70,COL.bad,8,'center',800);
},
capacitorbank(c){const on=c.connected;body(c,100,80,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-30,80,60);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-30,80,60);
  for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(-20+i*20,0,12,0,7);ctx.strokeStyle=on?COL.ok:COL.mut;ctx.lineWidth=2;ctx.stroke();}
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,`${c.kvar}kvar`,0,52,on?COL.ok:COL.mut,10,'center',800);},
supercap(c){const soc=c.soc||50;body(c,80,100,soc>50?COL.ok:soc>20?COL.warn:COL.bad);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-30,-40,60,80);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-30,-40,60,80);
  const fillH=68*soc/100;ctx.fillStyle=soc>50?'#22c55e':soc>20?'#f59e0b':'#ef4444';
  ctx.fillRect(-26,34-fillH,52,fillH);
  txt(c,c.label,0,-48,COL.text,9);
  txt(c,`${soc.toFixed(0)}%`,0,52,COL.text,11,'center',800);
  txt(c,`${c.farads}F`,0,64,COL.mut,8,'center',800);},
fuse(c){const blown=c.blown;body(c,60,40,blown?COL.bad:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-25,-15,50,30);
  ctx.strokeStyle=blown?COL.bad:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-25,-15,50,30);
  ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(20,0);ctx.strokeStyle=blown?COL.bad:COL.ok;ctx.lineWidth=3;ctx.stroke();
  if(blown){ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.fillStyle=COL.bad;ctx.fill();}
  txt(c,`${c.rating}A`,0,25,COL.text,8,'center',800);},
spd(c){body(c,80,60,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-35,-25,70,50);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-35,-25,70,50);
  ctx.beginPath();ctx.moveTo(-20,-10);ctx.lineTo(20,10);ctx.lineTo(-20,10);ctx.lineTo(20,-10);ctx.closePath();ctx.fillStyle=COL.warn;ctx.fill();
  txt(c,c.label,0,-32,COL.text,9);
  txt(c,c.type.toUpperCase(),0,32,COL.mut,8,'center',800);},
earthrod(c){body(c,60,100,COL.pe);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-20,-40,40,80);
  ctx.strokeStyle=COL.pe;ctx.lineWidth=2;ctx.strokeRect(-20,-40,40,80);
  ctx.beginPath();ctx.moveTo(0,40);ctx.lineTo(0,60);ctx.strokeStyle=COL.pe;ctx.lineWidth=4;ctx.stroke();
  txt(c,c.label,0,-48,COL.text,9);
  txt(c,`${c.resistance}Ω`,0,52,COL.text,10,'center',800);},
lightning(c){body(c,60,80,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-25,-30,50,60);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-25,-30,50,60);
  ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(-10,-5);ctx.lineTo(5,-5);ctx.lineTo(-5,20);ctx.lineTo(10,20);ctx.lineTo(0,25);ctx.closePath();ctx.fillStyle=COL.warn;ctx.fill();
  txt(c,c.label,0,-38,COL.text,9);},
relay(c){const on=c.coilOn;body(c,100,80,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-30,80,60);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-30,80,60);
  ctx.beginPath();ctx.arc(0,25,10,0,7);ctx.fillStyle=on?COL.ok:COL.mut;ctx.fill();
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,c.contact.toUpperCase(),0,52,on?COL.ok:COL.mut,9,'center',800);},
ssr(c){const on=c.on;body(c,80,60,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-30,-25,60,50);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-30,-25,60,50);
  ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(10,0);ctx.strokeStyle=on?COL.ok:COL.mut;ctx.lineWidth=3;ctx.stroke();
  txt(c,c.label,0,-32,COL.text,9);
  txt(c,`${c.rating}A`,0,32,on?COL.ok:COL.mut,8,'center',800);},
selector(c){body(c,100,80,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-30,80,60);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-30,80,60);
  ctx.beginPath();ctx.arc(0,0,8,0,7);ctx.fillStyle=COL.mut;ctx.fill();
  for(let i=1;i<=3;i++){const a=(i-1)*45-45;ctx.beginPath();ctx.moveTo(Math.cos(a)*15,Math.sin(a)*15);ctx.lineTo(Math.cos(a)*25,Math.sin(a)*25);ctx.strokeStyle=i===c.position?COL.ok:COL.mut;ctx.lineWidth=2;ctx.stroke();}
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,`POS ${c.position}`,0,52,COL.text,9,'center',800);},
transfer(c){body(c,120,80,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-50,-30,100,60);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-50,-30,100,60);
  ctx.beginPath();ctx.moveTo(-25,0);ctx.lineTo(25,c.position==='norm'?-15:15);ctx.strokeStyle=COL.ok;ctx.lineWidth=3;ctx.stroke();
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,c.position.toUpperCase(),0,52,COL.text,9,'center',800);},
disconnect(c){const on=c.closed;body(c,80,60,on?COL.ok:COL.bad);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-30,-25,60,50);
  ctx.strokeStyle=on?COL.ok:COL.bad;ctx.lineWidth=2;ctx.strokeRect(-30,-25,60,50);
  ctx.beginPath();ctx.moveTo(-15,-10);ctx.lineTo(15,-10);ctx.lineTo(15,10);ctx.lineTo(-15,10);ctx.closePath();ctx.fillStyle=on?COL.ok:COL.bad;ctx.fill();
  txt(c,c.label,0,-32,COL.text,9);
  txt(c,on?'CLOSED':'OPEN',0,32,on?COL.ok:COL.bad,8,'center',800);},
plc(c){body(c,140,100,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-60,-40,120,80);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-60,-40,120,80);
  ctx.fillStyle='#0a141f';ctx.fillRect(-40,-25,80,30);
  ctx.strokeStyle='#4a6a8c';ctx.strokeRect(-40,-25,80,30);
  ctx.beginPath();ctx.arc(-20,20,5,0,7);ctx.fillStyle=c.input1?COL.ok:COL.mut;ctx.fill();
  ctx.beginPath();ctx.arc(0,20,5,0,7);ctx.fillStyle=c.input2?COL.ok:COL.mut;ctx.fill();
  ctx.beginPath();ctx.arc(20,20,5,0,7);ctx.fillStyle=c.output1?COL.ok:COL.mut;ctx.fill();
  ctx.beginPath();ctx.arc(40,20,5,0,7);ctx.fillStyle=c.output2?COL.ok:COL.mut;ctx.fill();
  txt(c,c.label,0,-48,COL.text,10);
  txt(c,c.program.toUpperCase(),0,52,COL.mut,9,'center',800);},
vfd(c){const on=c.on;body(c,140,120,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-60,-50,120,100);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-60,-50,120,100);
  // Industrial VFD display
  ctx.fillStyle='#0a141f';ctx.fillRect(-45,-38,90,28);
  ctx.strokeStyle='#3a4a5a';ctx.lineWidth=2;ctx.strokeRect(-45,-38,90,28);
  // LCD segments
  ctx.fillStyle=on?COL.ok:'#2a3a4a';ctx.fillRect(-40,-30,20,16);
  ctx.fillRect(-15,-30,20,16);ctx.fillRect(10,-30,20,16);
  txt(c,on?`${c.hz.toFixed(1)}Hz`:'OFF',0,-22,on?COL.ok:COL.mut,12,'center',800);
  // Status LEDs
  ctx.beginPath();ctx.arc(-40,10,4,0,7);ctx.fillStyle=on?COL.ok:COL.mut;ctx.fill();
  ctx.beginPath();ctx.arc(0,10,4,0,7);ctx.fillStyle=c.rpm>0?COL.ok:COL.mut;ctx.fill();
  ctx.beginPath();ctx.arc(40,10,4,0,7);ctx.fillStyle=c.torque>50?COL.warn:COL.mut;ctx.fill();
  // Control buttons
  ctx.fillStyle='#3a4a5a';ctx.fillRect(-35,25,15,12);
  ctx.fillStyle='#3a4a5a';ctx.fillRect(-15,25,15,12);
  ctx.fillStyle='#3a4a5a';ctx.fillRect(5,25,15,12);
  if(on)glow(0,0,40,'rgba(6,214,160,.15)');
  txt(c,c.label,0,-58,COL.text,10);
  txt(c,`${c.rpm} RPM`,0,46,on?COL.ok:COL.mut,10,'center',800);
  txt(c,`${c.torque.toFixed(0)}%`,0,58,COL.mut,9,'center',800);},
softstart(c){const on=c.on;body(c,120,100,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-50,-40,100,80);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-50,-40,100,80);
  ctx.beginPath();ctx.moveTo(-30,20);ctx.quadraticCurveTo(0,-10,30,20);ctx.strokeStyle=on?COL.ok:COL.mut;ctx.lineWidth=2;ctx.stroke();
  txt(c,c.label,0,-48,COL.text,10);
  txt(c,`${c.rampTime}s`,0,52,on?COL.ok:COL.mut,10,'center',800);},
pid(c){body(c,120,100,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-50,-40,100,80);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-50,-40,100,80);
  ctx.fillStyle='#0a141f';ctx.fillRect(-35,-25,70,20);
  ctx.strokeStyle='#4a6a8c';ctx.strokeRect(-35,-25,70,20);
  txt(c,`PV:${c.pv.toFixed(1)}`,0,-18,COL.text,9,'center',800);
  txt(c,`SP:${c.setpoint}`,0,-8,COL.text,9,'center',800);
  txt(c,c.label,0,-48,COL.text,10);
  txt(c,`OUT:${c.output.toFixed(1)}%`,0,52,COL.ok,10,'center',800);},
ct(c){body(c,60,60,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-25,-25,50,50);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-25,-25,50,50);
  ctx.beginPath();ctx.arc(0,0,18,0,7);ctx.strokeStyle='#b87333';ctx.lineWidth=3;ctx.stroke();
  txt(c,c.label,0,-32,COL.text,8);
  txt(c,`${c.ratio}`,0,32,COL.mut,8,'center',800);},
vt(c){body(c,60,60,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-25,-25,50,50);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-25,-25,50,50);
  ctx.beginPath();ctx.arc(0,0,18,0,7);ctx.strokeStyle='#b87333';ctx.lineWidth=3;ctx.stroke();
  txt(c,c.label,0,-32,COL.text,8);
  txt(c,`${c.ratio}`,0,32,COL.mut,8,'center',800);},
energymeter(c){body(c,80,100,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-35,-40,70,80);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-35,-40,70,80);
  ctx.fillStyle='#0a141f';ctx.fillRect(-25,-25,50,30);
  ctx.strokeStyle='#4a6a8c';ctx.strokeRect(-25,-25,50,30);
  txt(c,`${c.kwh.toFixed(2)}`,0,-10,COL.text,12,'center',800);
  txt(c,'kWh',0,2,COL.mut,8,'center',800);
  txt(c,c.label,0,-48,COL.text,9);
  txt(c,`${c.kw.toFixed(2)}kW`,0,52,COL.ok,10,'center',800);},
pfccap(c){const on=c.connected;body(c,60,60,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-25,-25,50,50);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-25,-25,50,50);
  ctx.beginPath();ctx.arc(0,0,18,0,7);ctx.strokeStyle=on?COL.ok:COL.mut;ctx.lineWidth=3;ctx.stroke();
  txt(c,c.label,0,-32,COL.text,8);
  txt(c,`${c.kvar}kvar`,0,32,on?COL.ok:COL.mut,8,'center',800);},
heater(c){const on=c.powered;body(c,80,80,on?COL.warn:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-35,-30,70,60);
  ctx.strokeStyle=on?COL.warn:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-35,-30,70,60);
  // Industrial heating elements
  for(let i=0;i<3;i++){const x=-20+i*20;
    ctx.fillStyle=on?'#ff6b35':'#3a4a5a';ctx.fillRect(x-3,-15,6,30);
    ctx.strokeStyle=on?'#ff8a5a':'#4a5a6a';ctx.lineWidth=2;ctx.strokeRect(x-3,-15,6,30);
    // Coil pattern
    ctx.beginPath();ctx.moveTo(x-3,-10);ctx.lineTo(x+3,-10);ctx.lineTo(x+3,-5);ctx.lineTo(x-3,-5);ctx.lineTo(x-3,0);ctx.lineTo(x+3,0);ctx.lineTo(x+3,5);ctx.lineTo(x-3,5);ctx.lineTo(x-3,10);ctx.lineTo(x+3,10);ctx.strokeStyle=on?'#ffaa7a':'#5a6a7a';ctx.lineWidth=1;ctx.stroke();}
  if(on)glow(0,0,35,'rgba(255,107,53,0.3)');
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,`${c.watts}W`,0,52,on?COL.warn:COL.mut,10,'center',800);
  txt(c,`${c.temperature.toFixed(0)}°C`,0,64,c.temperature>50?COL.warn:COL.mut,8,'center',800);},
fan(c){const on=c.powered;body(c,80,80,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-35,-30,70,60);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-35,-30,70,60);
  // Industrial fan housing
  ctx.fillStyle='#2a3a4a';ctx.beginPath();ctx.arc(0,0,28,0,7);ctx.fill();
  ctx.strokeStyle='#3a4a5a';ctx.lineWidth=2;ctx.stroke();
  // Fan blades
  if(on){c.ang=(c.ang||0)+DT()*sim.speed*20;ctx.save();ctx.translate(0,0);ctx.rotate(c.ang);
    for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-22);ctx.strokeStyle=COL.ok;ctx.lineWidth=3;ctx.stroke();}ctx.restore();
    glow(0,0,30,'rgba(6,214,160,.2)');}
  // Center hub
  ctx.fillStyle='#3a4a5a';ctx.beginPath();ctx.arc(0,0,6,0,7);ctx.fill();
  ctx.strokeStyle='#4a5a6a';ctx.lineWidth=1;ctx.stroke();
  // Directional airflow indicator
  if(on){ctx.beginPath();ctx.moveTo(0,-32);ctx.lineTo(-5,-38);ctx.lineTo(5,-38);ctx.closePath();ctx.fillStyle=COL.ok;ctx.fill();}
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,`${c.speed.toFixed(0)}%`,0,52,on?COL.ok:COL.mut,10,'center',800);},
ledstrip(c){const on=c.powered;body(c,100,40,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-45,-15,90,30);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-45,-15,90,30);
  for(let i=0;i<8;i++){ctx.beginPath();ctx.arc(-35+i*10,0,3,0,7);ctx.fillStyle=on?COL.ok:COL.mut;ctx.fill();}
  txt(c,c.label,0,-24,COL.text,8);
  txt(c,`${c.brightness.toFixed(0)}%`,0,24,on?COL.ok:COL.mut,9,'center',800);},
solenoid(c){const on=c.powered;body(c,80,60,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-35,-25,70,50);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-35,-25,70,50);
  ctx.beginPath();ctx.arc(0,0,15,0,7);ctx.strokeStyle=on?COL.ok:COL.mut;ctx.lineWidth=3;ctx.stroke();
  txt(c,c.label,0,-32,COL.text,9);
  txt(c,on?'OPEN':'CLOSED',0,32,on?COL.ok:COL.mut,9,'center',800);},
// Gas turbine power plant components
gasturbine(c){const on=c.on;body(c,160,120,on?COL.warn:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-70,-50,140,100);
  ctx.strokeStyle=on?COL.warn:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-70,-50,140,100);
  // Gas inlet pipe
  line([[-70,-40],[-50,-40]],'#ff9f1c',5);
  // Air inlet pipe
  line([[-70,-20],[-50,-20]],'#b87333',5);
  // Exhaust pipe
  line([[50,-40],[70,-40]],on?COL.warn:'#4a6a8c',5);
  // Electrical terminals
  line([[70,-10],[50,-10]],COL.live,3);
  line([[70,10],[50,10]],COL.neu,3);
  line([[70,30],[50,30]],COL.pe,3);
  if(on){c.ang=(c.ang||0)+DT()*sim.speed*15;ctx.save();ctx.translate(0,0);ctx.rotate(c.ang);
  for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-40);ctx.strokeStyle=COL.warn;ctx.lineWidth=4;ctx.stroke();}ctx.restore();}
  txt(c,c.label,0,-58,COL.text,10);
  txt(c,`${c.mw}MW`,0,52,on?COL.warn:COL.mut,12,'center',800);
  txt(c,`${c.rpm} RPM`,0,64,COL.mut,9,'center',800);},
steamturbine(c){const on=c.on;body(c,160,120,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-70,-50,140,100);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-70,-50,140,100);
  // Industrial turbine housing
  ctx.fillStyle='#2a3a4a';ctx.fillRect(-55,-40,110,80);
  ctx.strokeStyle='#3a4a5a';ctx.lineWidth=1;ctx.strokeRect(-55,-40,110,80);
  // Turbine blades
  if(on){c.ang=(c.ang||0)+DT()*sim.speed*12;ctx.save();ctx.translate(0,0);ctx.rotate(c.ang);
    for(let i=0;i<3;i++){ctx.rotate(Math.PI*2/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-35);ctx.strokeStyle=COL.ok;ctx.lineWidth=4;ctx.stroke();}ctx.restore();
    glow(0,0,40,'rgba(6,214,160,.2)');}
  // Generator coils
  ctx.fillStyle='#3a4a5a';ctx.beginPath();ctx.arc(0,0,20,0,7);ctx.fill();
  ctx.strokeStyle='#4a5a6a';ctx.lineWidth=2;ctx.stroke();
  // Steam inlet pipe
  line([[-70,-40],[-55,-40]],on?COL.warn:'#4a6a8c',5);
  // Condensate outlet pipe
  line([[-70,-20],[-55,-20]],'#59c3ff',5);
  // Exhaust pipe
  line([[50,-40],[65,-40]],on?COL.warn:'#4a6a8c',5);
  // Electrical terminals
  line([[65,-10],[50,-10]],COL.live,3);
  line([[65,10],[50,10]],COL.neu,3);
  line([[65,30],[50,30]],COL.pe,3);
  txt(c,c.label,0,-58,COL.text,10);
  txt(c,`${c.mw}MW`,0,52,on?COL.ok:COL.mut,12,'center',800);
  txt(c,`${c.temperature.toFixed(0)}°C`,0,64,on?COL.ok:COL.mut,9,'center',800);},
boiler(c){const on=c.on;body(c,140,100,on?COL.warn:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-60,-40,120,80);
  ctx.strokeStyle=on?COL.warn:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-60,-40,120,80);
  // Industrial boiler shell
  ctx.fillStyle='#2a3a4a';ctx.fillRect(-55,-35,110,70);
  ctx.strokeStyle='#3a4a5a';ctx.lineWidth=1;ctx.strokeRect(-55,-35,110,70);
  // Water drum with level indicator
  const h=60*c.waterLevel/100;ctx.fillStyle='#167fb0';ctx.fillRect(-50,20-h,100,h);
  ctx.fillStyle='#0a1620';ctx.fillRect(-50,20,100,2); // Water surface line
  // Furnace burner area
  if(on){glow(0,-20,30,'rgba(255,150,50,0.4)');ctx.fillStyle='#ff6b35';ctx.beginPath();ctx.arc(0,-25,15,0,7);ctx.fill();}
  // Pressure gauge
  ctx.beginPath();ctx.arc(40,-25,12,0,7);ctx.fillStyle='#0a141f';ctx.fill();
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.stroke();
  const ga=Math.min(1,(c.pressure||0)/200);ctx.save();ctx.translate(40,-25);ctx.rotate(-Math.PI/2+ga*Math.PI);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-8);ctx.strokeStyle=c.pressure>180?COL.bad:COL.ok;ctx.lineWidth=2;ctx.stroke();ctx.restore();
  // Temperature indicator
  ctx.fillStyle=c.temperature>300?COL.warn:COL.ok;ctx.fillRect(-50,32,Math.min(100,(c.temperature||20)/5),4);
  txt(c,c.label,0,-48,COL.text,10);
  txt(c,`${c.pressure.toFixed(1)} bar`,0,52,on?COL.warn:COL.mut,10,'center',800);
  txt(c,`${c.temperature.toFixed(0)}°C`,0,64,c.temperature>300?COL.warn:COL.mut,9,'center',800);},
condenser(c){body(c,120,80,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-50,-30,100,60);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-50,-30,100,60);
  // Industrial condenser shell
  ctx.fillStyle='#2a3a4a';ctx.fillRect(-45,-25,90,50);
  ctx.strokeStyle='#3a4a5a';ctx.lineWidth=1;ctx.strokeRect(-45,-25,90,50);
  // Cooling tubes
  for(let i=0;i<5;i++){const x=-35+i*18;
    ctx.fillStyle=c.pressure>2?'#59c3ff':'#3a5a6a';ctx.fillRect(x,-18,8,36);
    ctx.strokeStyle='#4a6a7a';ctx.lineWidth=1;ctx.strokeRect(x,-18,8,36);}
  // Flow indicators
  if(c.pressure>1){glow(0,0,25,'rgba(89,195,255,.2)');}
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,`${c.pressure.toFixed(1)} bar`,0,52,c.pressure>2?COL.ok:COL.mut,10,'center',800);},
coolingtower(c){body(c,140,140,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-60,-60,120,120);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-60,-60,120,120);
  // Industrial cooling tower structure
  ctx.fillStyle='#3a4a5a';ctx.beginPath();ctx.moveTo(-40,50);ctx.lineTo(-25,-50);ctx.lineTo(25,-50);ctx.lineTo(40,50);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#4a5a6a';ctx.lineWidth=2;ctx.stroke();
  // Fill lines
  ctx.strokeStyle='#2a3a4a';ctx.lineWidth=1;
  for(let i=0;i<8;i++){const y=50-i*12;ctx.beginPath();ctx.moveTo(-35+i*8,y);ctx.lineTo(-35+i*8,50);ctx.stroke();}
  // Fan at top
  if(c.fanSpeed>0){c.ang=(c.ang||0)+DT()*sim.speed*c.fanSpeed/20;ctx.save();ctx.translate(0,-45);ctx.rotate(c.ang);
    for(let i=0;i<3;i++){ctx.rotate(Math.PI*2/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-15);ctx.strokeStyle=COL.ok;ctx.lineWidth=2;ctx.stroke();}ctx.restore();
    glow(0,-45,20,'rgba(6,214,160,.2)');}
  // Water outlet indicator
  ctx.fillStyle='#59c3ff';ctx.fillRect(-10,52,20,4);
  txt(c,c.label,0,-68,COL.text,10);
  txt(c,`${c.fanSpeed.toFixed(0)}%`,0,52,c.fanSpeed>0?COL.ok:COL.mut,11,'center',800);},
governor(c){body(c,100,80,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-30,80,60);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-30,80,60);
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,`${c.setpoint} RPM`,0,52,COL.mut,10,'center',800);},
exciter(c){body(c,80,60,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-35,-25,70,50);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-35,-25,70,50);
  txt(c,c.label,0,-32,COL.text,9);
  txt(c,`${c.voltage}V`,0,52,COL.mut,10,'center',800);},
syncrelay(c){const on=c.synced;body(c,100,80,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-30,80,60);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-30,80,60);
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,on?'SYNCED':'OPEN',0,52,on?COL.ok:COL.mut,10,'center',800);},
busbar(c){body(c,200,30,COL.neu);
  ctx.fillStyle='#b87333';ctx.fillRect(-90,-10,180,20);
  ctx.strokeStyle='#8a6a22';ctx.lineWidth=3;ctx.strokeRect(-90,-10,180,20);
  txt(c,`${c.voltage}V`,0,0,COL.text,10,'center',800);},
hvbreaker(c){const on=c.closed&&!c.tripped;body(c,100,80,c.tripped?COL.bad:on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-30,80,60);
  ctx.strokeStyle=c.tripped?COL.bad:on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-30,80,60);
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,`${c.kv}kV`,0,52,COL.text,10,'center',800);},
transformerhv(c){body(c,140,100,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-60,-40,120,80);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-60,-40,120,80);
  ctx.beginPath();ctx.arc(-25,0,20,0,7);ctx.strokeStyle='#b87333';ctx.lineWidth=3;ctx.stroke();
  ctx.beginPath();ctx.arc(25,0,20,0,7);ctx.strokeStyle='#b87333';ctx.lineWidth=3;ctx.stroke();
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=4;ctx.strokeRect(-15,-25,30,50);
  txt(c,c.label,0,-48,COL.text,9);
  txt(c,`${c.priKv}→${c.secKv}kV`,0,52,COL.mut,8,'center',800);},
reactor(c){body(c,120,120,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-50,-50,100,100);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-50,-50,100,100);
  ctx.beginPath();ctx.arc(0,0,30,0,7);ctx.fillStyle='#e74c3c';ctx.fill();
  txt(c,c.label,0,-58,COL.text,10);
  txt(c,`${c.mvar}MVAR`,0,52,COL.warn,11,'center',800);
  txt(c,`${c.ratedV}kV`,0,64,COL.mut,9,'center',800);},
// Gas system components
gascompressor(c){const on=c.on;body(c,140,100,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-60,-40,120,80);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-60,-40,120,80);
  // Industrial compressor housing
  ctx.fillStyle='#2a3a4a';ctx.fillRect(-50,-30,100,60);
  ctx.strokeStyle='#3a4a5a';ctx.lineWidth=1;ctx.strokeRect(-50,-30,100,60);
  // Compressor cylinder
  ctx.fillStyle='#3a5a6a';ctx.beginPath();ctx.arc(0,-15,25,0,7);ctx.fill();
  ctx.strokeStyle='#4a6a7a';ctx.lineWidth=2;ctx.stroke();
  // Piston
  if(on){c.ang=(c.ang||0)+DT()*sim.speed*12;ctx.save();ctx.translate(0,-15);ctx.rotate(c.ang);
    ctx.fillStyle='#6a8aaa';ctx.fillRect(-8,-20,16,20);ctx.restore();}
  // Cooling fins
  for(let i=0;i<6;i++){const x=-35+i*14;ctx.fillStyle='#2a3a4a';ctx.fillRect(x,25,8,15);}
  txt(c,c.label,0,-48,COL.text,10);
  txt(c,`${c.pressure.toFixed(1)} bar`,0,52,on?COL.ok:COL.mut,10,'center',800);
  txt(c,`${c.flow.toFixed(0)} m³/h`,0,64,COL.mut,8,'center',800);},
gasvalve(c){const on=c.open;body(c,80,60,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-35,-25,70,50);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-35,-25,70,50);
  ctx.beginPath();ctx.moveTo(-15,-10);ctx.lineTo(15,10);ctx.lineTo(15,-10);ctx.lineTo(-15,10);ctx.closePath();ctx.fillStyle=on?COL.ok:COL.bad;ctx.fill();
  txt(c,c.label,0,-32,COL.text,9);
  txt(c,on?'OPEN':'CLOSED',0,32,on?COL.ok:COL.bad,9,'center',800);},
gasfilter(c){body(c,80,80,c.clogged?COL.bad:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-35,-35,70,70);
  ctx.strokeStyle=c.clogged?COL.bad:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-35,-35,70,70);
  for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-25+i*16,-25);ctx.lineTo(-25+i*16,25);ctx.strokeStyle=c.clogged?COL.bad:'#6a8aaa';ctx.lineWidth=2;ctx.stroke();}
  txt(c,c.label,0,-42,COL.text,9);},
gasmeter(c){body(c,80,80,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-35,-35,70,70);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-35,-35,70,70);
  txt(c,c.label,0,-42,COL.text,9);
  txt(c,`${c.flow.toFixed(0)} m³/h`,0,52,COL.ok,10,'center',800);},
pressureregulator(c){body(c,100,80,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-30,80,60);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-30,80,60);
  ctx.beginPath();ctx.arc(0,0,15,0,7);ctx.fillStyle=COL.mut;ctx.fill();
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,`${c.setpoint} bar`,0,52,COL.mut,10,'center',800);},
gastank(c){body(c,140,140,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-60,-60,120,120);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-60,-60,120,120);
  const h=100*c.level/100;ctx.fillStyle='#167fb0';ctx.fillRect(-55,40-h,110,h);
  txt(c,c.label,0,-68,COL.text,10);
  txt(c,`${c.level.toFixed(0)}%`,0,52,COL.text,12,'center',800);
  txt(c,`${c.pressure} bar`,0,64,COL.mut,9,'center',800);},
gaswell(c){const on=c.on;body(c,120,120,on?COL.warn:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-50,-50,100,100);
  ctx.strokeStyle=on?COL.warn:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-50,-50,100,100);
  line([[50,0],[25,0]],on?COL.warn:'#4a6a8c',5);
  txt(c,c.label,0,-58,COL.text,10);
  txt(c,`${c.pressure} bar`,0,52,on?COL.warn:COL.mut,10,'center',800);},
naturalgas(c){const on=c.on;body(c,100,80,on?COL.warn:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-30,80,60);
  ctx.strokeStyle=on?COL.warn:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-30,80,60);
  line([[40,0],[25,0]],on?COL.warn:'#4a6a8c',5);
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,`${c.pressure} bar`,0,52,on?COL.warn:COL.mut,10,'center',800);},
lpgtank(c){body(c,120,100,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-50,-40,100,80);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-50,-40,100,80);
  const h=60*c.level/100;ctx.fillStyle='#ff9f1c';ctx.fillRect(-45,30-h,90,h);
  txt(c,c.label,0,-48,COL.text,9);
  txt(c,`${c.level.toFixed(0)}%`,0,52,COL.text,10,'center',800);
  txt(c,`${c.pressure} bar`,0,64,COL.mut,9,'center',800);},
burner(c){const on=c.on;body(c,100,80,on?COL.warn:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-30,80,60);
  ctx.strokeStyle=on?COL.warn:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-30,80,60);
  if(on){glow(0,0,40,'rgba(255,150,50,0.6)');ctx.beginPath();ctx.arc(0,0,20,0,7);ctx.fillStyle='#ff6b35';ctx.fill();}
  line([[40,0],[25,0]],on?COL.warn:'#4a6a8c',5);
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,`${c.flameTemp}°C`,0,52,on?COL.warn:COL.mut,10,'center',800);},
combustionchamber(c){const on=c.on;body(c,140,100,on?COL.warn:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-60,-40,120,80);
  ctx.strokeStyle=on?COL.warn:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-60,-40,120,80);
  if(on){glow(0,0,50,'rgba(255,100,50,0.7)');ctx.beginPath();ctx.arc(0,0,30,0,7);ctx.fillStyle='#ff4500';ctx.fill();}
  txt(c,c.label,0,-48,COL.text,10);
  txt(c,`${c.temperature}°C`,0,52,on?COL.warn:COL.mut,12,'center',800);},
steamsource(c){const on=c.on;body(c,120,100,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-50,-40,100,80);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-50,-40,100,80);
  line([[50,0],[35,0]],on?COL.ok:'#4a6a8c',5);
  txt(c,c.label,0,-48,COL.text,10);
  txt(c,`${c.pressure} bar`,0,52,on?COL.ok:COL.mut,12,'center',800);
  txt(c,`${c.temperature}°C`,0,64,COL.mut,9,'center',800);},
steamgenerator(c){const on=c.on;body(c,140,120,on?COL.warn:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-60,-50,120,100);
  ctx.strokeStyle=on?COL.warn:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-60,-50,120,100);
  if(on){glow(0,0,50,'rgba(255,100,50,0.6)');ctx.beginPath();ctx.arc(0,0,35,0,7);ctx.fillStyle='#ff6b35';ctx.fill();}
  line([[60,-40],[45,-40]],on?COL.warn:'#4a6a8c',5);
  txt(c,c.label,0,-58,COL.text,10);
  txt(c,`${c.temperature}°C`,0,52,on?COL.warn:COL.mut,12,'center',800);},
flame(c){const on=c.on;body(c,80,80,on?COL.warn:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-35,-35,70,70);
  ctx.strokeStyle=on?COL.warn:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-35,-35,70,70);
  if(on){glow(0,0,40,'rgba(255,100,50,0.8)');ctx.beginPath();ctx.arc(0,0,25,0,7);ctx.fillStyle='#ff4500';ctx.fill();}
  txt(c,c.label,0,-42,COL.text,9);
  txt(c,`${c.temperature}°C`,0,52,on?COL.warn:COL.mut,10,'center',800);},
furnace(c){const on=c.on;body(c,140,120,on?COL.warn:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-60,-50,120,100);
  ctx.strokeStyle=on?COL.warn:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-60,-50,120,100);
  if(on){glow(0,0,60,'rgba(255,100,50,0.7)');ctx.beginPath();ctx.arc(0,0,40,0,7);ctx.fillStyle='#ff4500';ctx.fill();}
  line([[60,0],[45,0]],on?COL.warn:'#4a6a8c',5);
  txt(c,c.label,0,-58,COL.text,10);
  txt(c,`${c.temperature}°C`,0,52,on?COL.warn:COL.mut,12,'center',800);},
// Steam system components
steampipe(c){body(c,100,20,COL.neu);
  ctx.fillStyle='#b87333';ctx.fillRect(-45,-8,90,16);
  ctx.strokeStyle='#8a6a22';ctx.lineWidth=3;ctx.strokeRect(-45,-8,90,16);
  txt(c,`${c.diameter}mm`,0,0,COL.text,8,'center',800);},
steamtrap(c){const on=c.open;body(c,60,60,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-25,-25,50,50);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-25,-25,50,50);
  txt(c,c.label,0,-32,COL.text,9);
  txt(c,on?'OPEN':'CLOSED',0,32,on?COL.ok:COL.mut,9,'center',800);},
steamseparator(c){body(c,100,100,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-40,80,80);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-40,80,80);
  ctx.beginPath();ctx.arc(0,0,25,0,7);ctx.fillStyle='#59c3ff';ctx.fill();
  txt(c,c.label,0,-48,COL.text,9);
  txt(c,`${(c.efficiency*100).toFixed(0)}%`,0,52,COL.ok,10,'center',800);},
feedwaterpump(c){const on=c.on;body(c,120,80,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-50,-30,100,60);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-50,-30,100,60);
  if(on){c.ang=(c.ang||0)+DT()*sim.speed*8;ctx.save();ctx.translate(0,0);ctx.rotate(c.ang);
  for(let i=0;i<3;i++){ctx.rotate(Math.PI*2/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-25);ctx.strokeStyle=COL.ok;ctx.lineWidth=3;ctx.stroke();}ctx.restore();}
  txt(c,c.label,0,-38,COL.text,10);
  txt(c,`${c.flow} m³/h`,0,52,on?COL.ok:COL.mut,10,'center',800);},
economizer(c){body(c,140,80,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-60,-30,120,60);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-60,-30,120,60);
  for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-50+i*26,-20);ctx.lineTo(-50+i*26,20);ctx.strokeStyle='#ff9f1c';ctx.lineWidth=2;ctx.stroke();}
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,`${(c.efficiency*100).toFixed(0)}%`,0,52,COL.ok,10,'center',800);},
superheater(c){body(c,140,80,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-60,-30,120,60);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-60,-30,120,60);
  for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-50+i*26,-20);ctx.lineTo(-50+i*26,20);ctx.strokeStyle=COL.warn;ctx.lineWidth=2;ctx.stroke();}
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,`${c.temperature.toFixed(0)}°C`,0,52,COL.warn,10,'center',800);},
reheater(c){body(c,140,80,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-60,-30,120,60);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-60,-30,120,60);
  for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-50+i*26,-20);ctx.lineTo(-50+i*26,20);ctx.strokeStyle=COL.warn;ctx.lineWidth=2;ctx.stroke();}
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,`${c.temperature.toFixed(0)}°C`,0,52,COL.warn,10,'center',800);},
// Plumbing components
gatevalve(c){const on=c.open;body(c,80,60,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-35,-25,70,50);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-35,-25,70,50);
  ctx.beginPath();ctx.moveTo(-20,-10);ctx.lineTo(20,-10);ctx.lineTo(20,10);ctx.lineTo(-20,10);ctx.closePath();ctx.fillStyle=on?COL.ok:COL.bad;ctx.fill();
  txt(c,c.label,0,-32,COL.text,9);
  txt(c,on?'OPEN':'CLOSED',0,32,on?COL.ok:COL.bad,9,'center',800);},
globevalve(c){const on=c.open;body(c,80,60,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-35,-25,70,50);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-35,-25,70,50);
  ctx.beginPath();ctx.arc(0,0,15,0,7);ctx.fillStyle=on?COL.ok:COL.bad;ctx.fill();
  txt(c,c.label,0,-32,COL.text,9);
  txt(c,on?'OPEN':'CLOSED',0,32,on?COL.ok:COL.bad,9,'center',800);},
ballvalve(c){const on=c.open;body(c,80,60,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-35,-25,70,50);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-35,-25,70,50);
  ctx.beginPath();ctx.arc(0,0,15,0,7);ctx.fillStyle=on?COL.ok:COL.bad;ctx.fill();
  txt(c,c.label,0,-32,COL.text,9);
  txt(c,on?'OPEN':'CLOSED',0,32,on?COL.ok:COL.bad,9,'center',800);},
butterflyvalve(c){const on=c.open;body(c,80,60,on?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-35,-25,70,50);
  ctx.strokeStyle=on?COL.ok:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-35,-25,70,50);
  ctx.beginPath();ctx.moveTo(-15,0);ctx.lineTo(15,-10);ctx.lineTo(15,10);ctx.closePath();ctx.fillStyle=on?COL.ok:COL.bad;ctx.fill();
  txt(c,c.label,0,-32,COL.text,9);
  txt(c,on?'OPEN':'CLOSED',0,32,on?COL.ok:COL.bad,9,'center',800);},
expansionjoint(c){body(c,100,40,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-15,80,30);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-15,80,30);
  ctx.beginPath();ctx.moveTo(-20,-10);ctx.lineTo(-20,10);ctx.moveTo(0,-10);ctx.lineTo(0,10);ctx.moveTo(20,-10);ctx.lineTo(20,10);ctx.strokeStyle='#b87333';ctx.lineWidth=2;ctx.stroke();
  txt(c,c.label,0,-24,COL.text,8);},
flange(c){body(c,60,60,COL.edge);
  ctx.fillStyle='#b87333';ctx.fillRect(-25,-25,50,50);
  ctx.strokeStyle='#8a6a22';ctx.lineWidth=3;ctx.strokeRect(-25,-25,50,50);
  ctx.beginPath();ctx.arc(0,0,15,0,7);ctx.fillStyle='#1a2a3c';ctx.fill();
  txt(c,`${c.size}mm`,0,0,COL.text,8,'center',800);},
gasket(c){body(c,60,60,COL.edge);
  ctx.fillStyle='#22c55e';ctx.fillRect(-25,-25,50,50);
  ctx.strokeStyle='#16a34a';ctx.lineWidth=2;ctx.strokeRect(-25,-25,50,50);
  ctx.beginPath();ctx.arc(0,0,15,0,7);ctx.fillStyle='#1a2a3c';ctx.fill();
  txt(c,c.material,0,0,COL.text,7,'center',800);},
pipesupport(c){body(c,60,80,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-25,-35,50,70);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-25,-35,50,70);
  txt(c,c.type,0,52,COL.text,9,'center',800);},
reducer(c){body(c,80,40,COL.edge);
  ctx.fillStyle='#b87333';ctx.beginPath();ctx.moveTo(-35,-15);ctx.lineTo(35,-10);ctx.lineTo(35,10);ctx.lineTo(-35,15);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#8a6a22';ctx.lineWidth=2;ctx.stroke();
  txt(c,`${c.sizeIn}→${c.sizeOut}`,0,0,COL.text,8,'center',800);},
teejoint(c){body(c,60,60,COL.edge);
  ctx.fillStyle='#b87333';ctx.fillRect(-25,-25,50,50);
  ctx.strokeStyle='#8a6a22';ctx.lineWidth=2;ctx.strokeRect(-25,-25,50,50);
  txt(c,`${c.size}mm`,0,0,COL.text,8,'center',800);},
elbow90(c){body(c,60,60,COL.edge);
  ctx.fillStyle='#b87333';ctx.beginPath();ctx.arc(0,0,25,0,Math.PI/2);ctx.lineWidth=15;ctx.strokeStyle='#b87333';ctx.stroke();
  ctx.strokeStyle='#8a6a22';ctx.lineWidth=2;ctx.stroke();
  txt(c,`${c.size}mm`,0,0,COL.text,8,'center',800);},
elbow45(c){body(c,60,60,COL.edge);
  ctx.fillStyle='#b87333';ctx.beginPath();ctx.arc(0,0,25,0,Math.PI/4);ctx.lineWidth=15;ctx.strokeStyle='#b87333';ctx.stroke();
  ctx.strokeStyle='#8a6a22';ctx.lineWidth=2;ctx.stroke();
  txt(c,`${c.size}mm`,0,0,COL.text,8,'center',800);},
// Power plant electrical
avr(c){body(c,100,80,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-30,80,60);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-30,80,60);
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,`${c.setpoint}V`,0,52,COL.ok,10,'center',800);},
differentialrelay(c){const on=c.tripped;body(c,100,80,on?COL.bad:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-30,80,60);
  ctx.strokeStyle=on?COL.bad:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-30,80,60);
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,on?'TRIPPED':'OK',0,52,on?COL.bad:COL.ok,10,'center',800);},
overcurrentrelay(c){const on=c.tripped;body(c,100,80,on?COL.bad:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-30,80,60);
  ctx.strokeStyle=on?COL.bad:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-30,80,60);
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,on?'TRIPPED':'OK',0,52,on?COL.bad:COL.ok,10,'center',800);},
distanceprotection(c){body(c,120,100,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-50,-40,100,80);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-50,-40,100,80);
  txt(c,c.label,0,-48,COL.text,9);
  txt(c,`Z1:${c.zone1} Z2:${c.zone2}`,0,52,COL.mut,8,'center',800);},
synchroscope(c){body(c,100,100,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-40,80,80);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-40,80,80);
  ctx.beginPath();ctx.arc(0,0,30,0,7);ctx.strokeStyle=COL.ok;ctx.lineWidth=2;ctx.stroke();
  const a=c.angle||0;ctx.save();ctx.translate(0,0);ctx.rotate(a);
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-25);ctx.strokeStyle=COL.ok;ctx.lineWidth=3;ctx.stroke();ctx.restore();
  txt(c,c.label,0,-48,COL.text,9);
  txt(c,`${Number(c.angle||0).toFixed(0)}°`,0,52,COL.ok,10,'center',800);},
generatorprotection(c){body(c,140,120,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-60,-50,120,100);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-60,-50,120,100);
  txt(c,c.label,0,-58,COL.text,10);
  txt(c,`${(Array.isArray(c.functions)?c.functions:[]).length} Functions`,0,52,COL.ok,10,'center',800);},
// Additional steam components
deaerator(c){body(c,120,100,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-50,-40,100,80);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-50,-40,100,80);
  const h=60*c.efficiency;ctx.fillStyle='#59c3ff';ctx.fillRect(-45,30-h,90,h);
  txt(c,c.label,0,-48,COL.text,9);
  txt(c,`${(c.efficiency*100).toFixed(0)}%`,0,52,COL.ok,10,'center',800);},
lpsystem(c){body(c,100,80,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-30,80,60);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-30,80,60);
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,`${c.pressure} bar`,0,52,COL.mut,10,'center',800);},
hpsystem(c){body(c,100,80,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-40,-30,80,60);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-40,-30,80,60);
  txt(c,c.label,0,-38,COL.text,9);
  txt(c,`${c.pressure} bar`,0,52,COL.warn,10,'center',800);},
feedwatertank(c){body(c,120,100,COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-50,-40,100,80);
  ctx.strokeStyle='#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-50,-40,100,80);
  const h=60*c.level/100;ctx.fillStyle='#167fb0';ctx.fillRect(-45,30-h,90,h);
  txt(c,c.label,0,-48,COL.text,9);
  txt(c,`${c.level.toFixed(0)}%`,0,52,COL.text,10,'center',800);},
blowdown(c){const on=c.open;body(c,80,60,on?COL.warn:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-35,-25,70,50);
  ctx.strokeStyle=on?COL.warn:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-35,-25,70,50);
  txt(c,c.label,0,-32,COL.text,9);
  txt(c,on?'OPEN':'CLOSED',0,32,on?COL.warn:COL.mut,9,'center',800);}
});
const _d0=describe;describe=function(c){if(c.type!=='motor')return _d0(c);const V=sim.volts||220,sp=c.spin||0;
  return `State : ${c.cutout?'THERMAL CUT-OUT':c.powered?(sp<.9?'run-up':'running'):sp>.05?'coasting down':'stopped'}\nSpeed : ${Math.round(sp*2880)} rpm\nCurrent: ${(c.I||0).toFixed(1)} A (FLA ${(c.hp*746/c.eff/V/c.pf).toFixed(1)} A)\nFlow  : ${((c.flow||0)*600).toFixed(1)} L/min\nPressure: ${(c.pressure||0).toFixed(2)} bar (${((c.pressure||0)*10.2).toFixed(1)} m head)\nShut-off: ${(2.5+3*c.hp).toFixed(1)} bar @ full speed\nWater : ${(c.temperature||20).toFixed(1)} °C\nDry-run heat: ${Math.min(100,(c.dryHeat||0)*10).toFixed(0)}%`;};
setInterval(()=>{const k=$('pcv'),c=selected&&selected.kind==='c'?getC(selected.id):null;if(!c||c.type!=='motor'){k.style.display='none';return;}k.style.display='block';
  const g=k.getContext('2d'),W=560,H=220,m=34,Qr=c.hp*72,P0=2.5+3*c.hp,Q=Qr*1.1,P=P0*1.15;g.clearRect(0,0,W,H);g.font='11px ui-monospace,monospace';g.lineWidth=1;
  const X=q=>m+(W-2*m)*q/Q,Y=p=>H-m-(H-2*m)*p/P;
  for(let i=0;i<=4;i++){const y=H-m-(H-2*m)*i/4,x=m+(W-2*m)*i/4;g.strokeStyle='#1a2d48';g.beginPath();g.moveTo(m,y);g.lineTo(W-m,y);g.moveTo(x,m);g.lineTo(x,H-m);g.stroke();g.fillStyle='#7a92b0';g.fillText((P*i/4).toFixed(1),2,y+4);g.fillText(Math.round(Q*i/4),x-8,H-m+14);}
  g.fillStyle='#7a92b0';g.fillText('bar',2,m-14);g.fillText('L/min',W-46,H-8);g.fillText('Pump curve (full speed)',m+8,m-14);
  g.beginPath();for(let i=0;i<=60;i++){const q=Qr*i/60;i?g.lineTo(X(q),Y(P0*(1-(q/Qr)**2))):g.moveTo(X(q),Y(P0));}g.strokeStyle='#00b4d8';g.lineWidth=2.5;g.stroke();
  const sp=c.spin||0;if(sp>.02&&sp<.98){g.beginPath();for(let i=0;i<=60;i++){const q=Qr*sp*i/60;i?g.lineTo(X(q),Y(P0*sp*sp*(1-(q/(Qr*sp))**2))):g.moveTo(X(q),Y(P0*sp*sp));}g.strokeStyle='#2a6a8a';g.lineWidth=1.5;g.setLineDash([4,3]);g.stroke();g.setLineDash([]);}
  const ox=X((c.flow||0)*600),oy=Y(c.pressure||0);g.beginPath();g.arc(ox,oy,6,0,7);g.fillStyle=c.powered?'#ff9f1c':'#4a6380';g.fill();g.fillStyle='#e8f0fa';g.fillText('operating point',Math.min(ox+10,W-110),oy-8);},100);

function drawComp(c){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.rot*Math.PI/2);const drawer=DRAW[c.type==='rcd'?'mcb':c.type];if(drawer){drawer(c);}else{ctx.fillStyle='#ef476f';ctx.fillRect(-20,-10,40,20);ctx.fillStyle='#fff';ctx.font='10px sans-serif';ctx.fillText(c.type, -10, 4);}ctx.restore();}

function netColor(t){return t==='L'?COL.live:t==='N'?COL.neu:t==='PE'?COL.pe:COL.off;}
function drawPipeRouteHandles(P){
  (selected&&selected.kind==='w'?((wires.find(q=>q.id===selected.id)||{}).pts||[]):[]).forEach(q=>{
    ctx.beginPath();ctx.rect(q.x-5/view.z,q.y-5/view.z,10/view.z,10/view.z);ctx.fillStyle='#b8f2ff';ctx.fill();ctx.lineWidth=1.8/view.z;ctx.strokeStyle='#168bd2';ctx.stroke();
    ctx.beginPath();ctx.arc(q.x,q.y,1.5/view.z,0,Math.PI*2);ctx.fillStyle='#168bd2';ctx.fill();
  });
  for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],mx=(a.x+b.x)/2,my=(a.y+b.y)/2;ctx.beginPath();ctx.arc(mx,my,3.8/view.z,0,Math.PI*2);ctx.fillStyle='rgba(5,18,32,.92)';ctx.fill();ctx.lineWidth=1.6/view.z;ctx.strokeStyle='#63c8ff';ctx.stroke();}
}
function drawPipe(w,P,now){
  const hu=sim.hu,r=hu?hu.find(key(w.a.c,w.a.t)):null,sel=selected&&selected.kind==='w'&&selected.id===w.id;
  const flowing=!w.broken&&hu&&sim.hflow.has(r);
  // Determine pipe type based on component categories
  const compA=getC(w.a.c),compB=getC(w.b.c);
  const catA=compA?DEFS[compA.type].cat:'',catB=compB?DEFS[compB.type].cat:'';
  const isSteam=catA.includes('Steam')||catB.includes('Steam');
  const isGas=catA.includes('Gas')||catB.includes('Gas');
  const isHydraulic=catA.includes('Hydraulic')||catB.includes('Hydraulic');
  
  // Set colors based on pipe type
  let baseColor,midColor,flowColor;
  if(isSteam){
    baseColor=w.color||'#8B4513';midColor=w.color||'#CD853F';flowColor='#FF6347'; // Steam: brown to orange-red
  }else if(isGas){
    baseColor=w.color||'#FFD700';midColor=w.color||'#FFA500';flowColor='#FF4500'; // Gas: gold to orange
  }else{
    baseColor=w.color||'#2a5d85';midColor=w.color||'#2f9bd6';flowColor='#00b4d8'; // Water: blue tones
  }
  
  if(sel){drawPath(P);ctx.strokeStyle='rgba(0,180,216,.6)';ctx.lineWidth=15;ctx.lineJoin='round';ctx.stroke();}
  ctx.lineCap='round';ctx.lineJoin='round';
  if(w.broken){drawPath(P);ctx.setLineDash([8,8]);ctx.strokeStyle=COL.bad;ctx.lineWidth=5;ctx.stroke();ctx.setLineDash([]);
    const m=P[Math.floor(P.length/2)];ctx.fillStyle=COL.bad;ctx.font='800 14px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✕',m.x,m.y);if(sel)drawPipeRouteHandles(P);return;}
  drawPath(P);ctx.strokeStyle=baseColor;ctx.lineWidth=10;ctx.stroke();
  drawPath(P);ctx.strokeStyle=flowing?midColor:baseColor;ctx.lineWidth=6;ctx.stroke();ctx.translate(-1.3,-1.3);drawPath(P);ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1.8;ctx.stroke();ctx.translate(1.3,1.3);
  if(flowing){drawPath(P);ctx.setLineDash([4,12]);ctx.lineDashOffset=-now*.04*pipeDir(w);ctx.strokeStyle=flowColor;ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([]);}
  if(sel)drawPipeRouteHandles(P);
}
function tLabel(p,s,col){ctx.fillStyle=col;ctx.font='600 8px Inter,sans-serif';ctx.textBaseline='middle';
  if(p.dx>0){ctx.textAlign='right';ctx.fillText(s,p.x-8,p.y);}else if(p.dx<0){ctx.textAlign='left';ctx.fillText(s,p.x+8,p.y);}
  else if(p.dy<0){ctx.textAlign='center';ctx.fillText(s,p.x,p.y+11);}else{ctx.textAlign='center';ctx.fillText(s,p.x,p.y-11);}}
function drawPath(P){ctx.beginPath();P.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));}
function draw(now){
  NOW=now;const r=cv.getBoundingClientRect();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#091322';ctx.fillRect(0,0,r.width,r.height);
  ctx.save();ctx.translate(view.x,view.y);ctx.scale(view.z,view.z);
  const w0=toWorld(0,0),w1=toWorld(r.width,r.height);
  if(view.z>.45){ctx.fillStyle='rgba(60,95,140,.35)';const sx=Math.floor(w0.x/20)*20,sy=Math.floor(w0.y/20)*20;
    for(let x=sx;x<w1.x;x+=20)for(let y=sy;y<w1.y;y+=20){ctx.fillRect(x-.7,y-.7,1.4,1.4);}}
  const st=sim.st;
  // wires
  for(const w of wires){const P=routeWire(w);if(!P)continue;w._P=P;
    if(isPipe(w)){drawPipe(w,P,now);continue;}
    const ra=st?st.uf.find(key(w.a.c,w.a.t)):null,rb=st?st.uf.find(key(w.b.c,w.b.t)):null;
    const ty=st&&!w.broken?(st.cl.m.get(ra)||st.cl.m.get(rb)):null;const col=w.broken?COL.bad:netColor(ty);
    const sel=selected&&selected.kind==='w'&&selected.id===w.id;
    const wireCol=w.broken?COL.bad:(w.color||col);
    const flowing=!w.broken&&st&&(sim.flow.has(ra)||sim.flow.has(rb));
    // Industrial cable jacket, insulation and subtle reflective core.
    if(sel){drawPath(P);ctx.strokeStyle='rgba(0,180,216,.28)';ctx.lineWidth=14;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();}
    drawPath(P);ctx.strokeStyle='#050a11';ctx.lineWidth=isPipe(w)?10:8;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
    drawPath(P);ctx.strokeStyle=wireCol;ctx.lineWidth=isPipe(w)?6:4.2;ctx.lineCap='round';ctx.lineJoin='round';
    if(w.broken)ctx.setLineDash([5,6]);ctx.stroke();ctx.setLineDash([]);
    if(!isPipe(w)){drawPath(P);ctx.strokeStyle='rgba(255,255,255,.42)';ctx.lineWidth=1;ctx.stroke();}
    if(flowing&&w.trace!==false){drawPath(P);ctx.setLineDash([2,13]);ctx.lineDashOffset=-now*.045;ctx.strokeStyle='rgba(255,255,255,.96)';ctx.lineWidth=2.4;ctx.stroke();ctx.setLineDash([]);}
    if(w.broken){const m=P[Math.floor(P.length/2)];ctx.fillStyle=COL.bad;ctx.font='800 14px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✕',m.x,m.y);}
    if(sel){
      // Proteus-style route editing for both electrical wires and fluid pipes: solid square nodes at bends and small grab
      // points at each segment centre. Segment handles are deliberately subtle.
      (w.pts||[]).forEach(q=>{ctx.beginPath();ctx.rect(q.x-5/view.z,q.y-5/view.z,10/view.z,10/view.z);ctx.fillStyle=isPipe(w)?'#b8f2ff':'#f8fafc';ctx.fill();ctx.lineWidth=1.8/view.z;ctx.strokeStyle=isPipe(w)?'#168bd2':'#00b4d8';ctx.stroke();ctx.beginPath();ctx.arc(q.x,q.y,1.5/view.z,0,Math.PI*2);ctx.fillStyle=isPipe(w)?'#168bd2':'#00b4d8';ctx.fill();});
      for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],mx=(a.x+b.x)/2,my=(a.y+b.y)/2;ctx.beginPath();ctx.arc(mx,my,3.4/view.z,0,Math.PI*2);ctx.fillStyle='rgba(5,18,32,.92)';ctx.fill();ctx.lineWidth=1.4/view.z;ctx.strokeStyle=isPipe(w)?'#63c8ff':'#8bdcf5';ctx.stroke();}
    }
  }
  for(const c of comps){drawComp(c);if(multiSelected.has(c.id)||(selected&&selected.kind==='c'&&selected.id===c.id)){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.rot*Math.PI/2);ctx.strokeStyle=multiSelected.has(c.id)?'#ffd166':'#00b4d8';ctx.lineWidth=2/view.z;ctx.setLineDash([5/view.z,3/view.z]);const d=DEFS[c.type];ctx.strokeRect(-d.w/2-5,-d.h/2-5,d.w+10,d.h+10);ctx.restore();}}
  if(marquee){const x=Math.min(marquee.sx,marquee.cx),y=Math.min(marquee.sy,marquee.cy),w=Math.abs(marquee.cx-marquee.sx),h=Math.abs(marquee.cy-marquee.sy);ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='rgba(0,180,216,.13)';ctx.strokeStyle='#00b4d8';ctx.setLineDash([5,4]);ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);ctx.restore();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.translate(view.x,view.y);ctx.scale(view.z,view.z);}
  // terminals
  const conn=new Set();wires.forEach(w=>{conn.add(key(w.a.c,w.a.t));conn.add(key(w.b.c,w.b.t));});
  for(const c of comps)for(const t of DEFS[c.type].term){const p=termWorld(c.id,t[0]);const k=key(c.id,t[0]);
    const ty=st?st.cl.m.get(st.uf.find(k)):null;const hot=hoverTerm&&hoverTerm.c===c.id&&hoverTerm.t===t[0];
    if(t[5]==='h'){const fl=sim.hu&&sim.hflow.has(sim.hu.find(k)),q=hot?6:4.5;ctx.fillStyle=conn.has(k)?(fl?'#59c3ff':'#35546f'):'#0b1628';ctx.fillRect(p.x-q,p.y-q,q*2,q*2);
      ctx.lineWidth=1.8;ctx.strokeStyle=hot?'#fff':'#59c3ff';ctx.strokeRect(p.x-q,p.y-q,q*2,q*2);tLabel(p,t[0],'#6bb8e8');continue;}
    ctx.beginPath();ctx.arc(p.x,p.y,hot?6.5:4.5,0,7);ctx.fillStyle=conn.has(k)?(ty?netColor(ty):'#9db4cf'):'#0b1628';ctx.fill();
    ctx.lineWidth=1.8;ctx.strokeStyle=hot?'#fff':(ty?netColor(ty):'#6f89a8');ctx.stroke();
    if(c.type!=='junction'){ctx.fillStyle=COL.mut;ctx.font='600 8px Inter,sans-serif';ctx.textBaseline='middle';
      if(p.dx>0){ctx.textAlign='right';ctx.fillText(t[0],p.x-8,p.y);}else if(p.dx<0){ctx.textAlign='left';ctx.fillText(t[0],p.x+8,p.y);}
      else if(p.dy<0){ctx.textAlign='center';ctx.fillText(t[0],p.x,p.y+11);}else{ctx.textAlign='center';ctx.fillText(t[0],p.x,p.y-11);}}}
  // wire in progress
  if(wiring){const A=termWorld(wiring.from.c,wiring.from.t);const m=wiring.target||mouseSnap();
    const P=[{x:A.x,y:A.y},...wiring.pts];const last=P[P.length-1];
    const tgt=wiring.target?termWorld(wiring.target.c,wiring.target.t):null;
    P.push(tgt?{x:tgt.x,y:tgt.y}:lockAxis(last,m));
    const Q=orthoPath(P,A);drawPath(Q);ctx.setLineDash([6,5]);ctx.strokeStyle=tkind(wiring.from)==='h'?'#59c3ff':'#00e0ff';ctx.lineWidth=tkind(wiring.from)==='h'?4:2.5;ctx.stroke();ctx.setLineDash([]);
    wiring.pts.forEach(p=>{ctx.fillStyle='#00e0ff';ctx.beginPath();ctx.arc(p.x,p.y,3.5,0,7);ctx.fill();});}
  ctx.restore();
}
function mouseSnap(){const p=toWorld(mouse.cx,mouse.cy);return{x:snap(p.x),y:snap(p.y)};}
function lockAxis(last,m){return Math.abs(m.x-last.x)>=Math.abs(m.y-last.y)?{x:m.x,y:last.y}:{x:last.x,y:m.y};}
function orthoPath(P,A){const o=[P[0]];for(let i=1;i<P.length;i++){const a=o[o.length-1],b=P[i];
  if(a.x!==b.x&&a.y!==b.y)o.push(i===1?(A.dx!==0?{x:b.x,y:a.y}:{x:a.x,y:b.y}):{x:b.x,y:a.y});o.push(b);}return o;}

/* ───────────── hit testing ───────────── */
function hitTerm(p){const th=Math.max(8,11/view.z);let best=null,bd=th;
  for(const c of comps)for(const t of DEFS[c.type].term){const q=termWorld(c.id,t[0]);const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<bd){bd=d;best={c:c.id,t:t[0]};}}return best;}
function hitComp(p){for(let i=comps.length-1;i>=0;i--){const c=comps[i],d=DEFS[c.type];const l=rotv(p.x-c.x,p.y-c.y,4-c.rot);
  if(Math.abs(l[0])<=d.w/2&&Math.abs(l[1])<=d.h/2)return c;}return null;}
function hitWire(p){const th=Math.max(5,7/view.z);for(const w of wires){const P=w._P;if(!P)continue;
  for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1;
    let t=((p.x-a.x)*dx+(p.y-a.y)*dy)/l2;t=Math.max(0,Math.min(1,t));if(Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy))<th)return w;}}return null;}

/* ───────────── interaction ───────────── */
cv.addEventListener('contextmenu',e=>{e.preventDefault();if(wiring)wiring=null;});
cv.addEventListener('mousedown',e=>{
  const r=cv.getBoundingClientRect();mouse.cx=e.clientX-r.left;mouse.cy=e.clientY-r.top;const p=toWorld(mouse.cx,mouse.cy);
  if(e.button===1){pan={sx:mouse.cx,sy:mouse.cy,vx:view.x,vy:view.y};e.preventDefault();return;}
  if(e.button!==0)return;
  if(selected&&selected.kind==='w'){
    const sw=wires.find(q=>q.id===selected.id);
    if(sw){
      const P=routeWire(sw)||[];
      // Bend-node drag has priority over segment drag, as in schematic editors.
      const hi=(sw.pts||[]).findIndex(q=>Math.hypot(q.x-p.x,q.y-p.y)<Math.max(9,12/view.z));
      if(hi>=0){pushUndo();wireDrag={mode:'point',w:sw,index:hi};return;}
      // Grab any straight section to move the whole run sideways. Two new
      // orthogonal corners are inserted, preserving the connected endpoints.
      let si=-1,sd=Infinity;
      for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1;
        const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l2));
        const d=Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));
        if(d<sd){sd=d;si=i;}}
      if(si>=0&&sd<Math.max(7,10/view.z)&&P.length>2){
        const a=P[si],b=P[si+1],horizontal=Math.abs(b.x-a.x)>=Math.abs(b.y-a.y);
        const original=(sw.pts||[]).map(q=>({x:q.x,y:q.y}));
        const pts=P.slice(1,-1).map(q=>({x:q.x,y:q.y}));
        const insertAt=Math.max(0,Math.min(pts.length,si));
        const m1=horizontal?{x:a.x,y:a.y}:{x:a.x,y:a.y};
        const m2=horizontal?{x:b.x,y:b.y}:{x:b.x,y:b.y};
        pts.splice(insertAt,0,m1,m2);pushUndo();sw.pts=pts;
        wireDrag={mode:'segment',w:sw,index:insertAt,axis:horizontal?'y':'x',start:horizontal?p.y:p.x,base1:horizontal?a.y:a.x,base2:horizontal?b.y:b.x,original};return;
      }
    }
  }
  const t=hitTerm(p);
  if(t){if(wiring&&!wiring.pressed){if(!(wiring.from.c===t.c&&wiring.from.t===t.t))addWire(wiring.from,t,wiring.pts);wiring=null;return;}
    wiring={from:t,pts:[],pressed:true,moved:false,sx:mouse.cx,sy:mouse.cy,target:null};return;}
  if(wiring){const A=termWorld(wiring.from.c,wiring.from.t);const last=wiring.pts.length?wiring.pts[wiring.pts.length-1]:{x:A.x,y:A.y};const m={x:snap(p.x),y:snap(p.y)};const q=lockAxis(last,m);if(q.x!==last.x||q.y!==last.y)wiring.pts.push(q);return;}
  const c=hitComp(p);
  if(c){
    if(e.shiftKey){if(multiSelected.has(c.id))multiSelected.delete(c.id);else multiSelected.add(c.id);selected={kind:'c',id:c.id};renderProps();return;}
    if(!multiSelected.has(c.id)){multiSelected.clear();selected={kind:'c',id:c.id};}
    else selected={kind:'c',id:c.id};renderProps();
    const ids=multiSelected.size?Array.from(multiSelected):[c.id];
    drag={c,ids,orig:new Map(ids.map(id=>{const q=getC(id);return[id,{x:q.x,y:q.y}]})),startX:p.x,startY:p.y,ox:p.x-c.x,oy:p.y-c.y,moved:false,sx:mouse.cx,sy:mouse.cy};
    if(c.type==='pb')c.pressed=true;return;
  }
  const w=hitWire(p);if(w){multiSelected.clear();selected={kind:'w',id:w.id};renderProps();return;}
  if(!e.shiftKey)multiSelected.clear();selected=null;renderProps();marquee={sx:mouse.cx,sy:mouse.cy,cx:mouse.cx,cy:mouse.cy,base:new Set(multiSelected)};
});

cv.addEventListener('dblclick',e=>{
  const r=cv.getBoundingClientRect(),p=toWorld(e.clientX-r.left,e.clientY-r.top),w=hitWire(p);
  if(!w)return;
  const P=routeWire(w);if(!P||P.length<2)return;
  let best=null,bd=Infinity;
  for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;
    const t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;
    const q={x:snap(a.x+t*dx),y:snap(a.y+t*dy)},d=Math.hypot(q.x-p.x,q.y-p.y);
    if(d<bd){bd=d;best=q;}}
  if(best&&bd<24/view.z){pushUndo();w.pts=w.pts||[];w.pts.push(best);selected={kind:'w',id:w.id};renderProps();}
});
window.addEventListener('mousemove',e=>{
  const r=cv.getBoundingClientRect();mouse.cx=e.clientX-r.left;mouse.cy=e.clientY-r.top;const p=toWorld(mouse.cx,mouse.cy);
  if(pan){view.x=pan.vx+(mouse.cx-pan.sx);view.y=pan.vy+(mouse.cy-pan.sy);}
  if(wireDrag){
    if(wireDrag.mode==='point'){const q=wireDrag.w.pts[wireDrag.index];if(q){q.x=snap(p.x);q.y=snap(p.y);}}
    else if(wireDrag.mode==='segment'){
      const delta=(wireDrag.axis==='y'?p.y:p.x)-wireDrag.start;
      const q1=wireDrag.w.pts[wireDrag.index],q2=wireDrag.w.pts[wireDrag.index+1];
      if(q1&&q2){if(wireDrag.axis==='y'){q1.y=snap(wireDrag.base1+delta);q2.y=snap(wireDrag.base2+delta);}else{q1.x=snap(wireDrag.base1+delta);q2.x=snap(wireDrag.base2+delta);}}
    }
  }
  if(marquee){marquee.cx=mouse.cx;marquee.cy=mouse.cy;}
  if(drag){if(!drag.moved&&Math.hypot(mouse.cx-drag.sx,mouse.cy-drag.sy)>4){drag.moved=true;pushUndo();drag.c.pressed=false;}
    if(drag.moved){for(const id of drag.ids){const q=getC(id),o=drag.orig.get(id);if(q&&o){q.x=snap(o.x+(p.x-drag.startX));q.y=snap(o.y+(p.y-drag.startY));}}}}
  const inside=mouse.cx>=0&&mouse.cy>=0&&mouse.cx<=r.width&&mouse.cy<=r.height;
  hoverTerm=inside&&!drag&&!pan?hitTerm(p):null;
  if(wiring){wiring.target=hoverTerm&&!(hoverTerm.c===wiring.from.c&&hoverTerm.t===wiring.from.t)?hoverTerm:null;
    if(wiring.pressed&&Math.hypot(mouse.cx-wiring.sx,mouse.cy-wiring.sy)>6)wiring.moved=true;}
  const tip=$('tip');
  if(hoverTerm&&inside){const c=getC(hoverTerm.c),st=sim.st;const ty=st?st.cl.m.get(st.uf.find(key(c.id,hoverTerm.t))):null;
    tip.textContent=tkind(hoverTerm)==='h'?`${c.label}.${hoverTerm.t} — water port (${sim.hu&&sim.hflow.has(sim.hu.find(key(c.id,hoverTerm.t)))?'flowing':'no flow'})`:`${c.label}.${hoverTerm.t} — `+(ty==='L'?`LIVE ${sim.volts} V`:ty==='N'?'NEUTRAL 0 V':ty==='PE'?'EARTH (PE)':'floating / not energised');
    tip.style.left=(e.clientX+14)+'px';tip.style.top=(e.clientY+12)+'px';tip.style.display='block';}
  else tip.style.display='none';
});
window.addEventListener('mouseup',e=>{
  if(wiring&&wiring.pressed){wiring.pressed=false;
    if(wiring.moved){const p=toWorld(mouse.cx,mouse.cy),t=hitTerm(p);
      if(t&&!(t.c===wiring.from.c&&t.t===wiring.from.t))addWire(wiring.from,t,wiring.pts);wiring=null;}}
  if(wireDrag){wireDrag=null;renderProps();}
  if(pan)pan=null;
  if(marquee){const x1=Math.min(marquee.sx,marquee.cx),x2=Math.max(marquee.sx,marquee.cx),y1=Math.min(marquee.sy,marquee.cy),y2=Math.max(marquee.sy,marquee.cy);if(Math.hypot(marquee.cx-marquee.sx,marquee.cy-marquee.sy)>5){multiSelected=new Set(marquee.base);for(const c of comps){const q={x:(c.x*view.z+view.x),y:(c.y*view.z+view.y)};if(q.x>=x1&&q.x<=x2&&q.y>=y1&&q.y<=y2)multiSelected.add(c.id);}selected=multiSelected.size?{kind:'c',id:Array.from(multiSelected).slice(-1)[0]}:null;renderProps();}marquee=null;}
  comps.forEach(c=>{if(c.type==='pb')c.pressed=false;});
  if(drag){const c=drag.c;if(!drag.moved)clickAction(c);drag=null;}
});
function clickAction(c){
  if(c.type==='switch'){pushUndo();c.closed=!c.closed;log(`${c.label} ${c.closed?'closed':'opened'}`);}
  else if(c.type==='source'){pushUndo();c.on=!c.on;log(`${c.label} ${c.on?'energised':'switched off'}`);}
  else if(c.type==='ats'){pushUndo();c.mode=c.mode==='auto'?'manual':'auto';log(`${c.label} ${c.mode.toUpperCase()} mode`);}
  else if(c.type==='mcb'||c.type==='rcd'||c.type==='acbreaker'||c.type==='dcbreaker'){pushUndo();if(c.tripped){c.tripped=false;c.closed=true;c.heat=0;log(`${c.label} reset`);}else{c.closed=!c.closed;log(`${c.label} ${c.closed?'closed':'opened'}`);}}
  else if((c.type==='motor'||c.type==='gearpump'||c.type==='silopump')&&c.cutout){if(c.dryHeat>3)log(`${c.label} still hot – wait to cool`);else{c.cutout=false;c.dryHeat=0;log(`${c.label} thermal cut-out reset`);}}
  else if(c.type==='valve'||c.type==='tap'){pushUndo();c.open=!c.open;log(`${c.label} ${c.open?'opened':'closed'}`);}
  else if(c.type==='overload'&&c.tripped){c.tripped=false;c.heat=0;log(`${c.label} reset`);}
  else if(c.type==='pressurecutoff'&&c.tripped){c.tripped=false;c.pressure=0;c.peakPressure=0;log(`${c.label} reset`);}
  else if(c.type==='float'&&c.mode==='auto'&&!tankOf(c)){c.up=!c.up;log(`${c.label} float ${c.up?'raised':'lowered'} (manual)`);}
  else if(c.type==='inverter'||c.type==='hybrid'||c.type==='hybridlfp'||c.type==='hybridlfpgt'||c.type==='hybridbms'||c.type==='chargecontroller'||c.type==='dcsource'||c.type==='batterycharger'){
    pushUndo();
    if(c.tripped){c.tripped=false;c.on=true;c._out=true;c.status='STANDBY';c.mode='STANDBY';log(`${c.label} trip reset — ON`);}
    else{c.on=!c.on;if(c.on){c.tripped=false;c._out=true;}log(`${c.label} ${c.on?'switched on (trip cleared)':'switched off'}`);}
  }
  else if(c.type==='generator'){pushUndo();c.on=!c.on;log(`${c.label} ${c.on?'started':'stopped'}`);}
  else if(c.type==='capacitorbank'||c.type==='pfccap'){pushUndo();c.connected=!c.connected;log(`${c.label} ${c.connected?'connected':'disconnected'}`);}
  else if(c.type==='fuse'){pushUndo();c.blown=false;log(`${c.label} replaced`);}
  else if(c.type==='relay'){pushUndo();c.coilOn=!c.coilOn;log(`${c.label} coil ${c.coilOn?'energized':'de-energized'}`);}
  else if(c.type==='ssr'){pushUndo();c.on=!c.on;log(`${c.label} ${c.on?'switched on':'switched off'}`);}
  else if(c.type==='disconnect'){pushUndo();c.closed=!c.closed;log(`${c.label} ${c.closed?'closed':'opened'}`);}
  else if(c.type==='vfd'||c.type==='softstart'){pushUndo();c.on=!c.on;log(`${c.label} ${c.on?'started':'stopped'}`);}
  else if(c.type==='gasturbine'||c.type==='steamturbine'||c.type==='boiler'){pushUndo();c.on=!c.on;log(`${c.label} ${c.on?'started':'stopped'}`);}
  else if(c.type==='hvbreaker'){pushUndo();if(c.tripped){c.tripped=false;log(`${c.label} reset`);}else{c.closed=!c.closed;log(`${c.label} ${c.closed?'closed':'opened'}`);}}
  else if(c.type==='syncrelay'){pushUndo();c.synced=!c.synced;log(`${c.label} ${c.synced?'synced':'unsynced'}`);}
  else if(c.type==='airsupply'&&c.cutout){pushUndo();c.cutout=false;c._heat=0;log(`${c.label} thermal cut-out reset`);}
  else if(c.type==='gascompressor'||c.type==='feedwaterpump'||c.type==='gasboosterpump'||c.type==='steamboosterpump'||c.type==='airsupply'){pushUndo();c.on=!c.on;log(`${c.label} ${c.on?'started':'stopped'}`);}
  else if(c.type==='gasvalve'||c.type==='gatevalve'||c.type==='globevalve'||c.type==='ballvalve'||c.type==='butterflyvalve'||c.type==='steamtrap'||c.type==='blowdown'){pushUndo();c.open=!c.open;log(`${c.label} ${c.open?'opened':'closed'}`);}
  else if(c.type==='gaswell'||c.type==='burner'||c.type==='combustionchamber'||c.type==='steamgenerator'||c.type==='flame'||c.type==='furnace'){pushUndo();c.on=!c.on;log(`${c.label} ${c.on?'started':'stopped'}`);}
  else if(c.type==='differentialrelay'||c.type==='overcurrentrelay'){pushUndo();c.tripped=false;log(`${c.label} reset`);}
  renderProps();
}
cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect(),cx=e.clientX-r.left,cy=e.clientY-r.top;
  const f=e.deltaY<0?1.1:1/1.1,nz=Math.max(.25,Math.min(3,view.z*f));const p=toWorld(cx,cy);view.z=nz;view.x=cx-p.x*nz;view.y=cy-p.y*nz;},{passive:false});
function zoomBy(f){const r=cv.getBoundingClientRect(),cx=r.width/2,cy=r.height/2,p=toWorld(cx,cy),nz=Math.max(.25,Math.min(3,view.z*f));view.z=nz;view.x=cx-p.x*nz;view.y=cy-p.y*nz;}
cv.addEventListener('dragover',e=>e.preventDefault());
cv.addEventListener('drop',e=>{e.preventDefault();const t=e.dataTransfer.getData('text/plain');if(!DEFS[t])return;
  const r=cv.getBoundingClientRect(),p=toWorld(e.clientX-r.left,e.clientY-r.top);addComp(t,p.x,p.y);});
window.addEventListener('keydown',e=>{
  if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)&&document.activeElement.type!=='range')return;
  const k=e.key.toLowerCase();
  if((e.ctrlKey||e.metaKey)&&k==='a'){e.preventDefault();multiSelected=new Set(comps.map(c=>c.id));selected=comps.length?{kind:'c',id:comps[comps.length-1].id}:null;renderProps();}
  else if(k==='escape'){wiring=null;marquee=null;multiSelected.clear();selected=null;renderProps();}
  else if(k==='delete'||k==='backspace'){delSel();e.preventDefault();}
  else if(k==='r'&&!e.ctrlKey)rotSel();
  else if((e.ctrlKey||e.metaKey)&&k==='z'){e.shiftKey?redo():undo();e.preventDefault();}
  else if((e.ctrlKey||e.metaKey)&&k==='y'){redo();e.preventDefault();}
  else if((e.ctrlKey||e.metaKey)&&k==='d'){dupSel();e.preventDefault();}
});

/* ───────────── searchable component palette ───────────── */
(function(){
  const palette=$('palette'),cats={};
  for(const[k,d]of Object.entries(DEFS))(cats[d.cat]=cats[d.cat]||[]).push(k);
  palette.innerHTML=`<div class="palette-search-wrap">
    <label class="palette-search-label" for="componentSearch">COMPONENT LIBRARY</label>
    <div class="palette-search-box"><span aria-hidden="true">⌕</span><input id="componentSearch" type="search" placeholder="Search components..." autocomplete="off" aria-label="Search components by name or category"><button type="button" id="clearComponentSearch" title="Clear search" aria-label="Clear search">×</button></div>
    <div id="componentSearchCount" class="palette-search-count" aria-live="polite"></div>
  </div><div id="componentGroups"></div>`;
  const groups=$('componentGroups');
  groups.innerHTML=Object.entries(cats).map(([cat,list])=>`<section class="palette-group" data-category="${cat}"><div class="cat">${cat}</div><div class="grid2">`+
    list.map(k=>`<div class="item" draggable="true" data-type="${k}" title="Drag to board or click to add"><div class="ic">${ICON[k]||DEFS[k].icon}</div><div class="nm">${DEFS[k].name}</div></div>`).join('')+'</div></section>').join('');
  const search=$('componentSearch'),clear=$('clearComponentSearch'),count=$('componentSearchCount');
  function filterComponents(){
    const q=search.value.trim().toLocaleLowerCase();let visible=0;
    groups.querySelectorAll('.palette-group').forEach(group=>{
      let groupVisible=0;
      group.querySelectorAll('.item').forEach(el=>{
        const d=DEFS[el.dataset.type];
        const match=!q||`${d.name} ${d.cat} ${d.tag} ${el.dataset.type}`.toLocaleLowerCase().includes(q);
        el.hidden=!match;if(match){visible++;groupVisible++;}
      });
      group.hidden=groupVisible===0;
    });
    count.textContent=q?`${visible} component${visible===1?'':'s'} found`:`${Object.keys(DEFS).length} components available`;
    clear.hidden=!search.value;
    let empty=$('componentSearchEmpty');
    if(!visible){
      if(!empty){empty=document.createElement('div');empty.id='componentSearchEmpty';empty.className='component-search-empty';empty.textContent='No components found. Try another name or category.';groups.appendChild(empty);}
    }else if(empty)empty.remove();
  }
  search.addEventListener('input',filterComponents);
  clear.addEventListener('click',()=>{search.value='';filterComponents();search.focus();});
  groups.querySelectorAll('.item').forEach(el=>{
    el.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',el.dataset.type));
    el.addEventListener('click',()=>{const r=cv.getBoundingClientRect(),p=toWorld(r.width/2,r.height/2),n=comps.length%6*20;addComp(el.dataset.type,p.x+n,p.y+n);});
  });
  filterComponents();
})();

/* ───────────── properties panel ───────────── */
const fld=(l,h)=>`<div class="f"><label>${l}</label>${h}</div>`;
const nI=(k,v,min,max,st)=>`<input type="number" data-k="${k}" data-t="n" value="${v}" min="${min}" max="${max}" step="${st}">`;
const sI=(k,v,o)=>`<select data-k="${k}" data-t="s">${o.map(x=>`<option value="${x[0]}"${x[0]===v?' selected':''}>${x[1]}</option>`).join('')}</select>`;
const cI=(k,v)=>`<input type="checkbox" data-k="${k}" data-t="b"${v?' checked':''}>`;
function updateFooter(){
  const tag=$('footerTag'),name=$('footerName'),desc=$('footerDesc');if(!tag||!name||!desc)return;
  const o=selObj();
  if(!o){tag.textContent='—';name.innerHTML='No component selected<small>Select a part on the board</small>';desc.textContent='Select a component to see a short description and how to connect it. Drag parts from the left palette, click terminals to start a wire or pipe; select a wire, double-click its path to add bends, then drag white handles to reshape it.';return;}
  if(selected.kind==='w'){
    const a=getC(o.a.c),b=getC(o.b.c),pipe=isPipe(o);
    tag.textContent=pipe?'PIPE':'WIRE';
    name.innerHTML=`${pipe?'Process pipe':'Electrical wire'}<small>${a?a.label:'?'}.${o.a.t} ↔ ${b?b.label:'?'}.${o.b.t}</small>`;
    desc.textContent=o.broken?(pipe?'This pipe is cut or burst — isolate, repair, then clear the fault flag.':'This conductor is open. Repair it before the circuit can carry current.'):(pipe?'Fluid follows this pipe only if both ports share a service (or one is an instrument) and inline valves/filters are open.':'Current follows this wire when protective devices are closed and there is a live–neutral pair.');
    return;
  }
  const d=DEFS[o.type]||{},terms=(d.term||[]).map(t=>t[0]+(t[5]==='h'?' (fluid)':' (elec)')).join(', ');
  tag.textContent=d.tag||o.type;
  name.innerHTML=`${esc(o.label||d.name||o.type)}<small>${esc(d.name||'')} · ${esc(d.cat||'')}</small>`;
  desc.textContent=(COMP_BLURB[o.type]||`${d.name} in the ${d.cat} library.`)+` Ports: ${terms||'none'}.`;
}
function renderProps(){
  const o=selObj(),el=$('props');if(!o){el.innerHTML='<div class="note">Select a component or wire. Drag parts in from the left; click terminals to wire.</div>';updateFooter();return;}
  let h='';
  if(selected.kind==='w'){
    const a=getC(o.a.c),b=getC(o.b.c);
    h=`<div class="note" style="margin-bottom:6px"><b>${isPipe(o)?'Pipe':'Industrial cable'}</b> ${a.label}.${o.a.t} ↔ ${b.label}.${o.b.t}<br>Drag a square bend node to reshape the wire/pipe, or drag a straight segment handle to move that section. Double-click a segment to insert a bend. Click Add bend to insert a route node.</div>`+
      fld(isPipe(o)?'Pipe cut / burst':'Open / cut (fault)',cI('broken',o.broken))+
      fld(isPipe(o)?'Pipe colour':'Insulation colour',`<input type="color" data-k="color" data-t="t" value="${esc(o.color||(isPipe(o)?'#2f9bd6':'#ff9f1c'))}" style="width:100%;height:30px;background:var(--panel);border:1px solid var(--line);border-radius:6px">`)+(!isPipe(o)?fld('Trace live current',cI('trace',o.trace!==false)):'')+
      fld('Bend offset',nI('bend',o.bend,-400,400,10))+
      `<div class="row"><button data-act="clearpts">Auto-route</button><button data-act="addbend">Add bend</button><button class="danger" data-act="del">Delete</button></div>`;
  }else{
    const c=o;h=`<div class="note" style="margin-bottom:6px"><b>${DEFS[c.type].name}</b></div>`+fld('Label',`<input type="text" data-k="label" data-t="t" value="${esc(c.label)}">`);
    const T={
      source:()=>fld('Energised',cI('on',c.on))+fld('Voltage (V)',nI('volts',c.volts,100,260,1)),
      mcb:()=>fld('Rating (A)',nI('rating',c.rating,1,63,1))+`<div class="row"><button data-act="click">Toggle / reset</button></div>`,
      acbreaker:()=>fld('Rated voltage (V)',nI('volts',c.volts,24,480,1))+fld('Trip rating (A)',nI('rating',c.rating,1,125,1))+`<div class="note">Two-pole AC breaker: switches line and neutral together.</div><div class="row"><button data-act="click">Toggle / reset</button></div>`,
      dcbreaker:()=>fld('Rated voltage (V)',nI('volts',c.volts,12,500,1))+fld('Trip rating (A)',nI('rating',c.rating,1,125,1))+`<div class="note">Two-pole DC breaker: switches positive and negative together.</div><div class="row"><button data-act="click">Toggle / reset</button></div>`,

      rcd:()=>fld('Sensitivity (mA)',nI('ma',c.ma,10,500,10))+`<div class="row"><button data-act="click">Toggle / reset</button></div>`,
      overload:()=>fld('Setting (A)',nI('setting',c.setting,.5,40,.5))+`<div class="row"><button data-act="click">Reset</button></div>`,
      float:()=>fld('Mode',sI('mode',c.mode,[['auto','Follow tank'],['up','Force UP'],['down','Force DOWN']]))+fld('Stop at (%)',nI('stop',c.stop,10,100,1))+fld('Restart at (%)',nI('restart',c.restart,0,90,1))+
        fld('Fault',sI('fault',c.fault,[['none','None'],['stuckNC','Stuck NC (bypass)'],['stuckNO','Stuck NO']])),
      contactor:()=>fld('Fault',sI('fault',c.fault,[['none','None'],['weld','Contacts welded'],['coilopen','Coil open']])),
      switch:()=>fld('Closed',cI('closed',c.closed)),
      pb:()=>fld('Normally closed',cI('nc',c.nc))+'<div class="note">Hold the mouse on the button to press.</div>',
      motor:()=>fld('Power (HP)',nI('hp',c.hp,.25,10,.25))+fld('Power factor',nI('pf',c.pf,.3,1,.01))+fld('Efficiency',nI('eff',c.eff,.3,1,.01))+fld('Inrush ×',nI('inrush',c.inrush,2,8,.5))+
        fld('Fills tank',cI('pump',c.pump))+fld('Fault',sI('fault',c.fault,[['none','None'],['stall','Stalled rotor'],['open','Open winding'],['earth','Earth leakage']])),
      gearpump:()=>fld('Power (HP)',nI('hp',c.hp,.5,8,.25))+fld('Power factor',nI('pf',c.pf,.3,1,.01))+fld('Efficiency',nI('eff',c.eff,.3,1,.01))+fld('Inrush ×',nI('inrush',c.inrush,2,8,.5))+
        fld('Flow factor',nI('flowK',c.flowK,.2,5,.1))+fld('Pressure factor',nI('headK',c.headK,.2,5,.1))+
        fld('Fault',sI('fault',c.fault,[['none','None'],['stall','Stalled rotor'],['open','Open winding'],['earth','Earth leakage']]))+
        `<div class="note"><b>Drive:</b> ${c.drive==='shaft'?'SHAFT — mechanical input from an engine/turbine via coupling':c.drive==='motor'?'MOTOR — L/N supply live':'none — wire L/N or connect SHAFT'}<br>Pipe SUC ← source tank OUT, DIS → destination tank IN. Gear pumps give high discharge pressure with high flow; raise Pressure factor for more bar, Flow factor for more L/min.</div>`,
      silo:()=>fld('Level (%)',`<input type="range" data-k="level" data-t="n" min="0" max="100" step="1" value="${c.level}">`)+fld('Outlet restriction (%)',`<input type="range" data-k="outletRestriction" data-t="n" min="0" max="100" step="1" value="${c.outletRestriction??30}"><div class="note"><b>${Math.round(c.outletRestriction??30)}% outlet capacity</b> · Lower values restrict transfer from this tank to downstream tanks.</div>`)+fld('Background use (%/s)',nI('drain',c.drain,0,5,.1)),
      silopump:()=>fld('Level (%)',`<input type="range" data-k="level" data-t="n" min="0" max="100" step="1" value="${c.level}">`)+fld('Power (HP)',nI('hp',c.hp,.5,8,.25))+fld('Power factor',nI('pf',c.pf,.3,1,.01))+fld('Efficiency',nI('eff',c.eff,.3,1,.01))+fld('Flow factor',nI('flowK',c.flowK,.2,5,.1))+fld('Pressure factor',nI('headK',c.headK,.2,5,.1))+fld('Background use (%/s)',nI('drain',c.drain,0,5,.1))+
        fld('Fault',sI('fault',c.fault,[['none','None'],['stall','Stalled rotor'],['open','Open winding'],['earth','Earth leakage']]))+
        `<div class="note"><b>Integrated pump:</b> wire L/N/PE to run it. IN = fill port · OUT = pump suction (tank inventory) · DIS = pressurized discharge to consumers. Pipe a lower tank/source OUT → IN to fill the silo; pipe DIS → upper tank IN or consumers to distribute.</div>`,
            acmotor:()=>fld('Power (HP)',nI('hp',c.hp,.1,50,.1))+fld('Power factor',nI('pf',c.pf,.3,1,.01))+fld('Efficiency',nI('eff',c.eff,.3,1,.01))+fld('Inrush ×',nI('inrush',c.inrush,2,10,.5))+fld('Fault',sI('fault',c.fault,[['none','None'],['stall','Stalled rotor'],['open','Open winding']])),
      dcmotor:()=>fld('Rated power (W)',nI('watts',c.watts,10,5000,10))+fld('Rated voltage (V)',nI('volts',c.volts,6,600,1))+fld('Efficiency',nI('eff',c.eff,.3,1,.01))+fld('Inrush ×',nI('inrush',c.inrush,1.5,8,.5))+fld('Speed (%)',nI('speedPct',c.speedPct,0,150,5))+fld('Fault',sI('fault',c.fault,[['none','None'],['stall','Stalled'],['open','Open']])),
lamp:()=>fld('Watts',nI('watts',c.watts,1,1000,1))+fld('Fault',sI('fault',c.fault,[['none','None'],['open','Open filament'],['earth','Earth leakage']])),
      tank:()=>fld('Level (%)',`<input type="range" data-k="level" data-t="n" min="0" max="100" step="1" value="${c.level}">`)+fld('Outlet restriction (%)',`<input type="range" data-k="outletRestriction" data-t="n" min="0" max="100" step="1" value="${c.outletRestriction??30}"><div class="note"><b>${Math.round(c.outletRestriction??30)}% outlet capacity</b> · Lower values restrict transfer from this tank to downstream tanks.</div>`)+fld('Background use (%/s)',nI('drain',c.drain,0,5,.1)),
      junction:()=>'',
      sump:()=>fld('Unlimited supply',cI('unlimited',c.unlimited))+fld('Level (%)',`<input type="range" data-k="level" data-t="n" min="0" max="100" step="1" value="${c.level}">`)+fld('Refill (%/s)',nI('refill',c.refill,0,5,.1)),
      valve:()=>fld('Opening (%)',`<input type="range" data-k="flowPercent" data-t="n" min="0" max="100" step="1" value="${Math.max(0,Math.min(100,c.flowPercent??25))}"><div class="note"><b>${Math.round(c.flowPercent??25)}% open</b> · 0% = fully closed · 100% = fully open</div>`)+`<div class="note">The valve throttles pump flow non-linearly. Tank transfer slows as the destination level rises. Default opening: 25%.</div>`,
      gauge:()=>fld('Scale max (bar)',nI('max',c.max,1,250,1))+fld('Service',sI('service',c.service||'auto',[['auto','Auto (water / steam / gas)'],['water','Water'],['steam','Steam'],['gas','Gas']]))+`<div class="note">Tee onto any process line. Detected: ${(c.fluid||'none').toUpperCase()} · ${(c.pressure||0).toFixed(2)} bar.</div>`,
      levelgauge:()=>fld('Scale max (%)',nI('max',c.max,10,100,10))+fld('Service',sI('service',c.service||'auto',[['auto','Auto'],['water','Water'],['steam','Steam'],['gas','Gas']]))+`<div class="note">Connect to a vessel nozzle. Works on water tanks, feedwater tanks, LPG and gas holders.</div>`,
      dpgauge:()=>fld('Scale max (bar)',nI('max',c.max,.1,50,.1))+fld('Service',sI('service',c.service||'auto',[['auto','Auto'],['water','Water'],['steam','Steam'],['gas','Gas']]))+`<div class="note">HI = high tap, LO = low tap. Use across a filter, orifice or two vessels.</div>`,
      vacuumgauge:()=>fld('Scale max (bar vac)',nI('max',c.max,.1,2,.1))+fld('Service',sI('service',c.service||'auto',[['auto','Auto'],['water','Water'],['steam','Steam'],['gas','Gas']]))+`<div class="note">Tee to pump suction, compressor inlet or condenser neck.</div>`,
      rotameter:()=>fld('Scale max',nI('max',c.max,1,10000,1))+fld('Service',sI('service',c.service||'auto',[['auto','Auto (water / steam / gas)'],['water','Water L/min'],['steam','Steam kg/h'],['gas','Gas m³/h']]))+`<div class="note">In-line IN→OUT. Units follow the fluid: ${(c.unit||'L/min')}.</div>`,
      flowmeter:()=>fld('Totaliser',nI('total',c.total,0,1e9,1))+fld('Service',sI('service',c.service||'auto',[['auto','Auto (water / steam / gas)'],['water','Water'],['steam','Steam'],['gas','Gas']]))+`<div class="note">In-line IN→OUT. Now ${(c.flow||0).toFixed(2)} ${c.unit||'L/min'} of ${(c.fluid||'none')}.</div>`,
      tempgauge:()=>fld('Scale max (°C)',nI('max',c.max,20,800,5))+fld('Service',sI('service',c.service||'auto',[['auto','Auto'],['water','Water'],['steam','Steam'],['gas','Gas']]))+`<div class="note">Tee onto the process. Steam and flue run hotter than water — raise the scale if the needle pegs.</div>`,
      checkvalve:()=>`<div class="note">One-way flow: IN → OUT only. State is calculated from simulated flow.</div>`,
      reliefvalve:()=>fld('Relief setting (bar)',nI('setting',c.setting,.5,20,.1)),
      pressurecutoff:()=>fld('Trip pressure (bar)',nI('setting',c.setting,.5,20,.1))+`<div class="note">Normally open. Latches CLOSED when inlet pressure reaches the setting. Reset only after checking the cause.</div><div class="row"><button data-act="resetcutoff">Reset cut-off</button></div>`,
      timer:()=>fld('Timer mode',sI('mode',c.mode,[['on-delay','ON-delay (TON)'],['off-delay','OFF-delay (TOF)'],['interval','Interval / pulse']]))+fld('Delay (seconds)',nI('delay',c.delay,0,3600,.1))+`<div class="note">Supply A1/A2. Use COM–NO for timed-on output or COM–NC for inverse output. ON-delay closes NO after the delay; OFF-delay keeps output on for the delay after coil power is removed; Interval turns output on for the set time after energising.</div><div class="row"><button data-act="resettimer">Reset timer</button></div>`,
      accumulator:()=>fld('Gas precharge (bar)',nI('precharge',c.precharge,0,20,.1))+fld('Initial fluid (%)',nI('fluid',c.fluid,0,1,.05)),
      filter:()=>fld('Clogged',cI('clogged',c.clogged)),
      manifold:()=>['OUT1','OUT2','OUT3'].map((t,i)=>fld('Outlet '+(i+1)+' open',cI('o'+(i+1),c['o'+(i+1)]!==false))).join('')+`<div class="note">Single inlet distributes to the open outlets only — each outlet can be isolated. Branch flow follows the path of least resistance; the readout shows the measured split.</div>`,
      solar:()=>fld('Rated power STC (W)',nI('watts',c.watts,50,20000,50))+fld('Sun intensity (%)',nI('sunIntensity',c.sunIntensity,0,100,1))+fld('Cloudiness',nI('cloudiness',c.cloudiness,0,0.8,0.05))+fld('Efficiency',nI('efficiency',c.efficiency,0.1,0.28,0.01))+fld('Area (m²)',nI('area',c.area||2,0.5,100,0.5))+fld('Tilt (°)',nI('tilt',c.tilt,0,90,5))+fld('Ambient (°C)',nI('ambient',c.ambient,-10,50,1))+fld('Temp. coeff. (/°C)',nI('tempCoeff',c.tempCoeff,-0.006,-0.002,0.0005))+fld('Soiling (0–1)',nI('soiling',c.soiling,0,0.5,0.05))+fld('Vmp / bus (V)',nI('voltage',c.voltage,12,60,1))+fld('Fault',sI('fault',c.fault||'none',[['none','None'],['open','Open circuit'],['short','Shorted']]))+`<div class="note">Irradiance: <b>${Math.round(c._irradiance||0)} W/m²</b> · Cell ${ (c._cellTemp||25).toFixed(0)}°C · ${c.status||'—'}<br>Output <b>${(c.outputPower||0).toFixed(0)} W</b> · ${(c.current||0).toFixed(2)} A. Power = area × G × η × tilt × (1−soiling) × temp factor.</div>`,
      battery:()=>fld('Capacity (Ah)',nI('capacity',c.capacity,10,500,10))+fld('SOC (%)',nI('soc',c.soc,0,100,1))+fld('Nominal voltage (V)',nI('voltage',c.voltage,12,48,1))+`<div class="note"><b>Separate terminals:</b> connect charger DC+ / DC− to battery IN+ / IN−. Connect loads or inverter to battery OUT+ / OUT−. Input and output terminals are internally common by polarity.</div>`,
      lfpbattery:()=>fld('Series cells',nI('series',c.series,1,32,1))+fld('Parallel strings',nI('parallel',c.parallel,1,20,1))+fld('Cell capacity (Ah)',nI('cellAh',c.cellAh,1,500,1))+fld('Cell nominal (V)',nI('cellNom',c.cellNom,2.5,3.5,0.05))+fld('Cell charge (V)',nI('cellChg',c.cellChg,3.4,3.7,0.01))+fld('Cell UV (V)',nI('cellUv',c.cellUv,2.0,2.8,0.05))+fld('CV SOC (%)',nI('cvSoc',c.cvSoc,80,99,1))+fld('Charge C-rate',nI('chargeC',c.chargeC,0.1,2,0.05))+fld('Discharge C-rate',nI('dischargeC',c.dischargeC,0.2,3,0.1))+fld('Cell Ri (mΩ)',nI('cellRi',c.cellRi,0.5,10,0.1))+fld('SOC (%)',nI('soc',c.soc,0,100,1))+fld('Ambient (°C)',nI('ambient',c.ambient,-10,50,1))+`<div class="note">Pack: ${packSeries(c)}S${packParallel(c)}P · ${packNomV(c).toFixed(1)} V nom · ${packAh(c).toFixed(0)} Ah · ${ (packNomV(c)*packAh(c)/1000).toFixed(1)} kWh. Charge IN+/IN−, load OUT+/OUT−. Route through BMS.</div>`,
      bms:()=>fld('Enabled',cI('on',c.on))+fld('Series cells',nI('series',c.series,1,32,1))+fld('OV cell (V)',nI('ovCell',c.ovCell,3.5,4.0,0.05))+fld('UV cell (V)',nI('uvCell',c.uvCell,2.0,2.8,0.05))+fld('Charge OC (A)',nI('occA',c.occA,5,200,5))+fld('Discharge OC (A)',nI('ocdA',c.ocdA,10,500,5))+fld('OT (°C)',nI('otC',c.otC,40,80,1))+fld('UT charge (°C)',nI('utCharge',c.utCharge,-20,10,1))+fld('UT discharge (°C)',nI('utDischarge',c.utDischarge,-30,0,1))+fld('Balance (mV)',nI('balanceMv',c.balanceMv,10,100,5))+fld('Balance on',cI('balanceOn',c.balanceOn))+`<div class="note">PACK± from battery, P± to inverter/load, C± to charger, CAN to hybrid. Status: ${c.status||'OK'} · Δcell ${c.cellDelta||0} mV.</div>`,
      hybridlfp:()=>fld('On',cI('on',c.on))+fld('Batt nominal (V)',nI('battNom',c.battNom,12,96,12))+fld('Rating (W)',nI('rating',c.rating,1000,15000,500))+fld('Efficiency',nI('efficiency',c.efficiency,0.85,0.99,0.01))+fld('Priority',sI('priority',c.priority,[['SBU','Solar > Battery > Utility'],['SUB','Solar > Utility > Battery'],['UTI','Utility first']]))+fld('Charge mode',cI('chargeMode',c.chargeMode))+fld('Charge current (A)',nI('chargeCurrent',c.chargeCurrent,5,100,5))+fld('Max PV charge (A)',nI('maxPV',c.maxPV,10,150,5))+fld('Bulk V',nI('bulkV',c.bulkV,48,60,0.1))+fld('Float V',nI('floatV',c.floatV,48,58,0.1))+fld('Low cut SOC (%)',nI('lowCut',c.lowCut,5,30,1))+fld('Switch SOC (%)',nI('switchSOC',c.switchSOC,10,40,1))+fld('Gen mode',sI('genMode',c.genMode,[['auto','Auto'],['on','Force on'],['off','Off']]))+fld('Gen start SOC (%)',nI('genStart',c.genStart,10,50,1))+fld('BMS required',cI('bmsRequired',c.bmsRequired))+`<div class="note">LFP hybrid: **Battery OUT+→BAT+, OUT−→BAT−** (or via external BMS P+/P−). PV to PV+/PV−. AC loads on OUT_L/OUT_N. Mode: ${c.mode||'OFF'} · ${c.status||''} · Load ${Math.round(c.loadW||0)} W · PV ${Math.round(c.pvW||0)} W · Chg ${(c._chgW||0).toFixed(0)} W.</div><div class="row"><button data-act="click">Toggle ON / Reset trip</button></div>`,
            hybridbms:()=>fld('On',cI('on',c.on))+fld('Batt nominal (V)',nI('battNom',c.battNom,12,96,12))+fld('Rating (W)',nI('rating',c.rating,1000,15000,500))+fld('Efficiency',nI('efficiency',c.efficiency,0.85,0.99,0.01))+fld('Priority',sI('priority',c.priority,[['SBU','Solar > Battery > Utility'],['SUB','Solar > Utility > Battery'],['UTI','Utility first']]))+fld('Charge mode',cI('chargeMode',c.chargeMode))+fld('Charge current (A)',nI('chargeCurrent',c.chargeCurrent,5,100,5))+fld('Max PV charge (A)',nI('maxPV',c.maxPV,10,150,5))+fld('Bulk V',nI('bulkV',c.bulkV,48,60,0.1))+fld('Float V',nI('floatV',c.floatV,48,58,0.1))+fld('Low cut SOC (%)',nI('lowCut',c.lowCut,5,30,1))+fld('Switch SOC (%)',nI('switchSOC',c.switchSOC,10,40,1))+fld('Gen mode',sI('genMode',c.genMode,[['auto','Auto'],['on','Force on'],['off','Off']]))+fld('Gen start SOC (%)',nI('genStart',c.genStart,10,50,1))+fld('Series cells (BMS)',nI('series',c.series,1,32,1))+fld('OV cell (V)',nI('ovCell',c.ovCell,3.5,4.0,0.05))+fld('UV cell (V)',nI('uvCell',c.uvCell,2.0,2.8,0.05))+fld('Charge OC (A)',nI('occA',c.occA,5,200,5))+fld('Discharge OC (A)',nI('ocdA',c.ocdA,10,500,5))+`<div class="note">Integrated BMS: wire LFP pack **OUT+ → BAT+**, **OUT− → BAT−**. PV+/PV− from solar. OUT_L/OUT_N to AC loads. Mode: ${c.mode||'OFF'} · ${c.status||''} · BMS ${c.bmsStatus||'OK'} · Charge ${(c._chgW||0).toFixed(0)} W.</div><div class="row"><button data-act="click">Toggle ON / Reset trip</button></div>`,
hybridlfpgt:()=>fld('On',cI('on',c.on))+fld('Batt nominal (V)',nI('battNom',c.battNom,12,96,12))+fld('Rating (W)',nI('rating',c.rating,1000,15000,500))+fld('Efficiency',nI('efficiency',c.efficiency,0.85,0.99,0.01))+fld('Priority',sI('priority',c.priority,[['SBU','Solar > Battery > Utility'],['SUB','Solar > Utility > Battery'],['UTI','Utility first']]))+fld('Charge mode',cI('chargeMode',c.chargeMode))+fld('Charge current (A)',nI('chargeCurrent',c.chargeCurrent,5,100,5))+fld('Max PV charge (A)',nI('maxPV',c.maxPV,10,150,5))+fld('Bulk V',nI('bulkV',c.bulkV,48,60,0.1))+fld('Float V',nI('floatV',c.floatV,48,58,0.1))+fld('Low cut SOC (%)',nI('lowCut',c.lowCut,5,30,1))+fld('Switch SOC (%)',nI('switchSOC',c.switchSOC,10,40,1))+fld('Export enable',cI('exportEnable',c.exportEnable))+fld('Export limit (W)',nI('exportLimit',c.exportLimit,0,10000,100))+fld('BMS required',cI('bmsRequired',c.bmsRequired))+`<div class="note">Grid-tie LFP: Battery OUT+→BAT+, OUT−→BAT−. Mode: ${c.mode||'OFF'} · ${c.status||''} · Load ${Math.round(c.loadW||0)} W · PV ${Math.round(c.pvW||0)} W.</div><div class="row"><button data-act="click">Toggle ON / Reset trip</button></div>`,
      acvawmeter:()=>`<div class="kpis"><div class="kpi"><b>Voltage</b><span>${(c.voltage||0).toFixed(1)} V</span></div><div class="kpi"><b>Current</b><span>${(c.current||0).toFixed(2)} A</span></div><div class="kpi"><b>Power</b><span>${(c.watts||0).toFixed(0)} W</span></div><div class="kpi"><b>Energy</b><span>${(c.kwh||0).toFixed(3)} kWh</span></div></div><div class="note">Series AC meter: L_in/N_in from source, L_out/N_out to load. PF ${(c.pf||1).toFixed(2)} · ${c.freq||50} Hz.</div>`,
      dcvawmeter:()=>`<div class="kpis"><div class="kpi"><b>Voltage</b><span>${(c.voltage||0).toFixed(1)} V</span></div><div class="kpi"><b>Current</b><span>${(c.current||0).toFixed(2)} A</span></div><div class="kpi"><b>Power</b><span>${(c.watts||0).toFixed(0)} W</span></div><div class="kpi"><b>Energy</b><span>${(c.kwh||0).toFixed(3)} kWh</span></div></div><div class="note">Series DC meter: +_in/−_in from source/BMS, +_out/−_out to load/inverter.</div>`,


      hybrid:()=>fld('Power rating (W)',nI('rating',c.rating,1000,20000,100))+fld('Efficiency',nI('efficiency',c.efficiency,0.8,0.99,0.01))+fld('Priority',sI('priority',c.priority,[['SBU','Solar → Battery → Utility'],['UTI','Utility first']]))+fld('Low-battery cut-off (% SOC)',nI('lowCut',c.lowCut,5,50,1))+fld('Switch to grid below (% SOC)',nI('switchSOC',c.switchSOC,10,80,1))+fld('Max PV charge (A)',nI('maxPV',c.maxPV,5,200,1))+fld('Charge battery from AC',cI('chargeMode',c.chargeMode))+fld('AC charge current (A)',nI('chargeCurrent',c.chargeCurrent,1,100,1))+fld('Generator input',sI('genMode',c.genMode,[['auto','Auto (battery low)'],['off','Disabled']]))+fld('Generator start (% SOC)',nI('genStart',c.genStart,10,80,1))+`<div class="note">Status: <b>${c.status||'-'}</b> · Source: ${c._src||'-'}<br>Ports: PV+/PV− (MPPT), BAT+/BAT−, GRID L/N/PE, GEN L/N/PE (optional), OUT L/N/PE (load). Single-phase model.</div><div class="row"><button data-act="click">Toggle ON/OFF (resets trip)</button></div>`,
      inverter:()=>fld('Power rating (W)',nI('rating',c.rating,500,10000,100))+fld('Efficiency',nI('efficiency',c.efficiency,0.8,0.98,0.01))+fld('Low-battery cut-off (% SOC)',nI('lowCut',c.lowCut,5,50,1))+fld('Charge battery from AC',cI('chargeMode',c.chargeMode))+fld('Charge current (A)',nI('chargeCurrent',c.chargeCurrent,1,100,1))+fld('AC priority (pass-through)',cI('acPriority',c.acPriority!==false))+`<div class="note">Status: <b>${c.status||'-'}</b> · Mode: ${c.mode||'-'}<br>Wire battery/solar bus to DC+/DC−, loads to AC L/N. Connect a grid or generator to the bottom IN_L/IN_N terminals to pass AC through and charge the battery (bulk to 80%, then taper).</div><div class="row"><button data-act="click">Toggle ON/OFF (resets trip)</button></div>`,
      chargecontroller:()=>fld('Mode',sI('mode',c.mode,[['mppt','MPPT'],['pwm','PWM']]))+fld('Bulk voltage (V)',nI('bulkVoltage',c.bulkVoltage,13,15,0.1))+fld('Float voltage (V)',nI('floatVoltage',c.floatVoltage,13,14,0.1))+`<div class="row"><button data-act="click">Toggle ON/OFF</button></div>`,
      dcsource:()=>fld('Voltage (V)',nI('volts',c.volts,5,48,1))+fld('Current (A)',nI('current',c.current,1,50,1))+`<div class="row"><button data-act="click">Toggle ON/OFF</button></div>`,
      batterycharger:()=>fld('Enabled',cI('on',c.on))+fld('AC input (V)',nI('acVoltage',c.acVoltage,100,260,1))+fld('Frequency (Hz)',nI('frequency',c.frequency,45,65,1))+fld('DC output (V)',nI('dcVoltage',c.dcVoltage,5,60,0.1))+fld('Current limit (A)',nI('currentLimit',c.currentLimit,0.5,100,0.5))+fld('Efficiency (%)',nI('efficiency',c.efficiency,0.5,0.99,0.01))+fld('Ripple (%)',nI('ripple',c.ripple,0,10,0.1))+`<div class="note">${esc(c.status||'OFFLINE')} · Output ${Number(c.outputCurrent||0).toFixed(2)} A · Input ${Number(c.inputCurrent||0).toFixed(2)} A</div>`,
      generator:()=>fld('Power (kVA)',nI('kva',c.kva,1,100,1))+fld('Fuel (%)',nI('fuel',c.fuel,0,100,1))+fld('Fuel rate (%/s)',nI('fuelRate',c.fuelRate,0.1,5,0.1))+`<div class="row"><button data-act="click">Start/Stop</button></div>`,
      transformer:()=>fld('Primary (V)',nI('priVolts',c.priVolts,110,480,10))+fld('Secondary (V)',nI('secVolts',c.secVolts,110,480,10))+fld('Power (kVA)',nI('kva',c.kva,1,100,1)),
      wind:()=>fld('Rated power (W)',nI('power',c.power,100,20000,100))+fld('Mean wind speed (m/s)',nI('windSpeed',c.windSpeed,0,35,0.5))+fld('Cut-in (m/s)',nI('cutIn',c.cutIn,2,6,0.5))+fld('Rated wind (m/s)',nI('ratedSpeed',c.ratedSpeed,6,18,0.5))+fld('Cut-out (m/s)',nI('cutOut',c.cutOut,18,35,0.5))+fld('Rotor diameter (m)',nI('rotorDiameter',c.rotorDiameter,1,20,0.5))+fld('Power coeff. Cp',nI('efficiency',c.efficiency,0.15,0.45,0.01))+fld('Air density (kg/m³)',nI('airDensity',c.airDensity,0.9,1.3,0.01))+fld('Turbulence intensity',nI('turbulence',c.turbulence,0,0.5,0.02))+fld('DC voltage (V)',nI('voltage',c.voltage,12,48,1))+fld('Fault',sI('fault',c.fault||'none',[['none','None'],['blade','Damaged blade'],['gen','Generator fault']]))+`<div class="note">Instant wind: <b>${(c._instWind||0).toFixed(1)} m/s</b> · ${c.status||'—'} · ${Math.round(c.rpm||0)} rpm<br>Power follows ½ρAv³Cp up to nameplate, then plateaus until cut-out.</div>`,
      capacitorbank:()=>fld('kVAR',nI('kvar',c.kvar,5,100,5))+fld('Voltage (V)',nI('voltage',c.voltage,230,480,10))+`<div class="row"><button data-act="click">Connect/Disconnect</button></div>`,
      supercap:()=>fld('Capacitance (F)',nI('farads',c.farads,10,1000,10))+fld('Voltage (V)',nI('voltage',c.voltage,1.2,3.3,0.1))+fld('SOC (%)',nI('soc',c.soc,0,100,1)),
      fuse:()=>fld('Rating (A)',nI('rating',c.rating,1,100,1))+`<div class="row"><button data-act="click" class="danger">Reset/Replace</button></div>`,
      spd:()=>fld('Type',sI('type',c.type,[['type1','Type 1'],['type2','Type 2'],['type3','Type 3']])),
      earthrod:()=>fld('Resistance (Ω)',nI('resistance',c.resistance,1,100,1)),
      lightning:()=>`<div class="note">Lightning protection device. Status: ${c.status}</div>`,
      relay:()=>fld('Contact',sI('contact',c.contact,[['NO','Normally Open'],['NC','Normally Closed']]))+`<div class="row"><button data-act="click">Toggle coil</button></div>`,
      ssr:()=>fld('Rating (A)',nI('rating',c.rating,1,100,1))+`<div class="row"><button data-act="click">Toggle ON/OFF</button></div>`,
      selector:()=>fld('Position',sI('position',String(c.position),[['0','OFF'],['1','POS 1'],['2','POS 2'],['3','POS 3']]))+`<div class="row"><button data-act="selectorPrev">◀ Previous</button><button data-act="selectorNext">Next ▶</button></div><div class="note">Break-before-make rotary selector: OFF isolates COM; positions 1–3 connect COM to one selected terminal only.</div>`,
      transfer:()=>fld('Position',sI('position',c.position,[['norm','Normal'],['emer','Emergency']])),
      ats:()=>fld('Mode',sI('mode',c.mode,[['auto','AUTO — priority based'],['manual','MANUAL — selected input']]))+fld('Priority source',nI('priority',c.priority,1,4,1))+fld('Manual input',nI('manualInput',c.manualInput,1,4,1))+fld('Transfer delay (s)',nI('transferDelay',c.transferDelay,0,10,.1))+fld('Dead time (s)',nI('deadTime',c.deadTime,0,2,.05))+`<div class="note"><b>Source status:</b> ${c._healthy?.map((v,i)=>`S${i+1}:${v?'READY':'OFF'}`).join(' · ')||'not evaluated'}<br><b>Active:</b> ${c._active?`SRC${c._active}`:'NONE'} · Break-before-make transfer.</div>`,
      disconnect:()=>`<div class="row"><button data-act="click">Open/Close</button></div>`,
      plc:()=>fld('Program',sI('program',c.program,[['auto','Auto'],['manual','Manual']]))+fld('Scan time (ms)',nI('scanTime',c.scanTime,1,100,1)),
      vfd:()=>fld('Frequency (Hz)',nI('hz',c.hz,0,60,1))+fld('Rated current (A)',nI('amps',c.amps,1,100,1))+`<div class="row"><button data-act="click">Start/Stop</button></div>`,
      softstart:()=>fld('Ramp time (s)',nI('rampTime',c.rampTime,1,30,1))+fld('Current limit (%)',nI('currentLimit',c.currentLimit,100,300,10))+`<div class="row"><button data-act="click">Start/Stop</button></div>`,
      pid:()=>fld('Kp',nI('kp',c.kp,0,100,1))+fld('Ki',nI('ki',c.ki,0,10,0.1))+fld('Kd',nI('kd',c.kd,0,10,0.1))+fld('Setpoint',nI('setpoint',c.setpoint,0,100,1))+fld('Mode',sI('mode',c.mode,[['auto','Auto'],['manual','Manual']])),
      ct:()=>fld('Ratio',sI('ratio',c.ratio,[['100/5','100/5'],['200/5','200/5'],['400/5','400/5']])),
      vt:()=>fld('Ratio',sI('ratio',c.ratio,[['400/100','400/100'],['230/100','230/100']])),
      energymeter:()=>`<div class="kpis"><div class="kpi"><b>Active power</b><span>${(c.kw||0).toFixed(3)} kW</span></div><div class="kpi"><b>Energy</b><span>${(c.kwh||0).toFixed(5)} kWh</span></div><div class="kpi"><b>Voltage</b><span>${(c.voltage||0).toFixed(1)} V</span></div><div class="kpi"><b>Current</b><span>${(c.current||0).toFixed(3)} A</span></div></div><div class="row"><button data-act="resetmeter">Reset kWh</button></div><div class="note">Energy accumulates only while the connected circuit is live and carrying load current.</div>`, 
      pfccap:()=>fld('kVAR',nI('kvar',c.kvar,5,50,5))+`<div class="row"><button data-act="click">Connect/Disconnect</button></div>`,
      heater:()=>fld('Power (W)',nI('watts',c.watts,500,5000,100)),
      fan:()=>fld('Power (W)',nI('watts',c.watts,10,200,10)),
      ledstrip:()=>fld('Power (W)',nI('watts',c.watts,10,200,10))+fld('LEDs',nI('leds',c.leds,1,100,1)),
      solenoid:()=>fld('Power (W)',nI('watts',c.watts,5,50,1)),
      gasturbine:()=>fld('Power (MW)',nI('mw',c.mw,10,500,10))+fld('Fuel (%)',nI('fuel',c.fuel,0,100,1))+`<div class="row"><button data-act="click">Start/Stop</button></div>`,
      steamturbine:()=>fld('Power (MW)',nI('mw',c.mw,10,500,10))+fld('Pressure (bar)',nI('pressure',c.pressure,50,200,10))+`<div class="row"><button data-act="click">Start/Stop</button></div>`,
      boiler:()=>fld('Pressure (bar)',nI('pressure',c.pressure,50,200,10))+fld('Temperature (°C)',nI('temperature',c.temperature,100,400,10))+`<div class="row"><button data-act="click">On/Off</button></div>`,
      condenser:()=>fld('Pressure (bar)',nI('pressure',c.pressure,1,100,1))+fld('Temperature (°C)',nI('temperature',c.temperature,-50,100,1))+fld('Cooling capacity (%)',nI('cooling',c.cooling,10,200,5)),
      coolingtower:()=>fld('Capacity (%)',nI('capacity',c.capacity,50,100,10)),
      governor:()=>fld('Setpoint (RPM)',nI('setpoint',c.setpoint,1500,3600,50)),
      exciter:()=>fld('Voltage (V)',nI('voltage',c.voltage,100,500,10))+fld('Current (A)',nI('current',c.current,10,200,5)),
      syncrelay:()=>`<div class="note">Sync relay for generator paralleling. Click to sync.</div>`,
      busbar:()=>fld('Voltage (V)',nI('voltage',c.voltage,380,33000,1000)),
      hvbreaker:()=>fld('Voltage (kV)',nI('kv',c.kv,0.4,33,0.1))+fld('Rating (A)',nI('rating',c.rating,100,5000,100))+`<div class="row"><button data-act="click">Open/Close</button></div>`,
      transformerhv:()=>fld('Primary (kV)',nI('priKv',c.priKv,0.4,33,0.1))+fld('Secondary (kV)',nI('secKv',c.secKv,0.4,33,0.1))+fld('Power (MVA)',nI('mva',c.mva,10,500,10)),
      reactor:()=>fld('MVAR',nI('mvar',c.mvar,10,200,10))+fld('Reactance (pu)',nI('x',c.x,0.1,1,0.05)),
      gasboosterpump:()=>fld('Discharge pressure (bar)',nI('pressure',c.pressure,5,80,1))+fld('Rated flow (m³/h)',nI('flow',c.flow,10,500,10))+`<div class="note">Needs gas at IN and a live supply across M / N.</div><div class="row"><button data-act="click">Start/Stop</button></div>`,
      steamboosterpump:()=>fld('Discharge pressure (bar)',nI('pressure',c.pressure,5,200,5))+fld('Rated flow (kg/h)',nI('flow',c.flow,500,50000,500))+`<div class="note">Needs steam at IN and a live supply across M / N.</div><div class="row"><button data-act="click">Start/Stop</button></div>`,
      airsupply:()=>fld('Blower on',cI('on',c.on))+fld('Unlimited air (ambient)',cI('unlimited',c.unlimited))+fld('Pressure (bar)',nI('pressure',c.pressure,.2,5,.1))+fld('Flow (m³/h)',nI('flow',c.flow,100,20000,100))+fld('Supply temp (°C)',nI('temperature',c.temperature??25,-20,80,1))+fld('Humidity (%RH)',nI('humidity',c.humidity??45,0,100,1))+fld('Motor power (kW)',nI('powerKw',c.powerKw??5.5,0,50,.5))+fld('Power factor',nI('pf',c.pf??.85,.3,1,.01))+fld('Fault',sI('fault',c.fault||'none',[['none','None'],['stall','Jammed rotor (overload)'],['open','Open winding'],['earth','Earth leakage']]))+
        `<div class="note">${c.unlimited?'UNLIMITED — open to atmosphere: air is always available at ~1.01 bar even with the blower off, at the set temperature/humidity.':'Forced-draft blower — pipe OUT to AIR_IN on burners, combustion chambers, furnaces and gas turbines.'} Pressure/flow apply only in blower mode.</div>`,
      fluestack:()=>`<div class="note">Terminate every economizer / superheater / reheater FLUE_OUT here.</div>`,
      gascompressor:()=>fld('Pressure (bar)',nI('pressure',c.pressure,5,50,1))+`<div class="row"><button data-act="click">Start/Stop</button></div>`,
      gasvalve:()=>`<div class="row"><button data-act="click">Open/Close</button></div>`+fld('Opening (%)',`<input type="range" data-k="opening" data-t="n" min="0" max="100" step="1" value="${Math.max(0,Math.min(100,c.opening??100))}">`)+`<div class="note">${c.open?(c.opening??100)>=100?'Fully open':Math.round(c.opening??100)+'% open — throttles flow':'Closed'}</div>`,
      gasfilter:()=>`<div class="note">Gas filter. Status: ${c.clogged?'CLOGGED':'OK'}</div>`,
      gasmeter:()=>`<div class="kpis"><div class="kpi"><b>Instant flow</b><span>${(c.flow||0).toFixed(2)} m³/h</span></div><div class="kpi"><b>Total volume</b><span>${(c.total||0).toFixed(3)} m³</span></div><div class="kpi"><b>Line pressure</b><span>${(c.pressure||0).toFixed(2)} bar</span></div></div><div class="row"><button data-act="resetgas">Reset total</button></div><div class="note">Flow and volume update only when a connected gas source supplies an open path.</div>`, 
      pressureregulator:()=>fld('Setpoint (bar)',nI('setpoint',c.setpoint,5,50,1)),
      gastank:()=>fld('Level (%)',nI('level',c.level,0,100,1)),
      gaswell:()=>`<div class="row"><button data-act="click">Start/Stop</button></div>`,
      naturalgas:()=>fld('Pressure (bar)',nI('pressure',c.pressure,5,50,1)),
      lpgtank:()=>fld('Level (%)',nI('level',c.level,0,100,1)),
      burner:()=>`<div class="row"><button data-act="click">Ignite/Extinguish</button></div>`,
      combustionchamber:()=>`<div class="row"><button data-act="click">Start/Stop</button></div>`,
      steamsource:()=>fld('Pressure (bar)',nI('pressure',c.pressure,50,200,10)),
      steamgenerator:()=>`<div class="row"><button data-act="click">Start/Stop</button></div>`,
      flame:()=>`<div class="row"><button data-act="click">Ignite/Extinguish</button></div>`,
      furnace:()=>`<div class="row"><button data-act="click">Start/Stop</button></div>`,
      steampipe:()=>fld('Diameter (mm)',nI('diameter',c.diameter,50,500,10)),
      steamtrap:()=>`<div class="row"><button data-act="click">Open/Close</button></div>`,
      ballvalve:()=>`<div class="row"><button data-act="click">Open/Close</button></div>`+fld('Opening (%)',`<input type="range" data-k="opening" data-t="n" min="0" max="100" step="1" value="${Math.max(0,Math.min(100,c.opening??100))}">`)+`<div class="note">${c.open?(c.opening??100)>=100?'Fully open':Math.round(c.opening??100)+'% open — throttles flow':'Closed'}</div>`,
      butterflyvalve:()=>`<div class="row"><button data-act="click">Open/Close</button></div>`+fld('Opening (%)',`<input type="range" data-k="opening" data-t="n" min="0" max="100" step="1" value="${Math.max(0,Math.min(100,c.opening??100))}">`)+`<div class="note">${c.open?(c.opening??100)>=100?'Fully open':Math.round(c.opening??100)+'% open — throttles flow':'Closed'}</div>`,
      steamseparator:()=>fld('Efficiency (%)',nI('efficiency',c.efficiency,0.8,1,0.01)),
      feedwaterpump:()=>`<div class="row"><button data-act="click">Start/Stop</button></div>`,
      economizer:()=>fld('Efficiency (%)',nI('efficiency',c.efficiency,0.7,0.95,0.01)),
      superheater:()=>fld('Temperature (°C)',nI('temperature',c.temperature,400,600,10)),
      reheater:()=>fld('Temperature (°C)',nI('temperature',c.temperature,400,600,10)),
      gatevalve:()=>`<div class="row"><button data-act="click">Open/Close</button></div>`+fld('Opening (%)',`<input type="range" data-k="opening" data-t="n" min="0" max="100" step="1" value="${Math.max(0,Math.min(100,c.opening??100))}">`)+`<div class="note">${c.open?(c.opening??100)>=100?'Fully open':Math.round(c.opening??100)+'% open — throttles flow':'Closed'}</div>`,
      globevalve:()=>`<div class="row"><button data-act="click">Open/Close</button></div>`+fld('Opening (%)',`<input type="range" data-k="opening" data-t="n" min="0" max="100" step="1" value="${Math.max(0,Math.min(100,c.opening??100))}">`)+`<div class="note">${c.open?(c.opening??100)>=100?'Fully open':Math.round(c.opening??100)+'% open — throttles flow':'Closed'}</div>`,
      ballvalve:()=>`<div class="row"><button data-act="click">Open/Close</button></div>`+fld('Opening (%)',`<input type="range" data-k="opening" data-t="n" min="0" max="100" step="1" value="${Math.max(0,Math.min(100,c.opening??100))}">`)+`<div class="note">${c.open?(c.opening??100)>=100?'Fully open':Math.round(c.opening??100)+'% open — throttles flow':'Closed'}</div>`,
      butterflyvalve:()=>`<div class="row"><button data-act="click">Open/Close</button></div>`+fld('Opening (%)',`<input type="range" data-k="opening" data-t="n" min="0" max="100" step="1" value="${Math.max(0,Math.min(100,c.opening??100))}">`)+`<div class="note">${c.open?(c.opening??100)>=100?'Fully open':Math.round(c.opening??100)+'% open — throttles flow':'Closed'}</div>`,
      flange:()=>fld('Size (mm)',nI('size',c.size,50,500,10)),
      gasket:()=>fld('Material',sI('material',c.material,[['PTFE','PTFE'],['Rubber','Rubber'],['Metal','Metal']])),
      reducer:()=>fld('Size In (mm)',nI('sizeIn',c.sizeIn,50,500,10))+fld('Size Out (mm)',nI('sizeOut',c.sizeOut,50,500,10)),
      teejoint:()=>fld('Size (mm)',nI('size',c.size,50,500,10)),
      elbow90:()=>fld('Size (mm)',nI('size',c.size,50,500,10)),
      elbow45:()=>fld('Size (mm)',nI('size',c.size,50,500,10)),
      avr:()=>fld('Setpoint (V)',nI('setpoint',c.setpoint,200,250,1)),
      differentialrelay:()=>`<div class="note">Differential protection. ${c.tripped?'TRIPPED':'OK'}</div>`,
      overcurrentrelay:()=>`<div class="note">Overcurrent protection. ${c.tripped?'TRIPPED':'OK'}</div>`,
      distanceprotection:()=>fld('Zone 1 (pu)',nI('zone1',c.zone1,0.5,0.9,0.05)),
      synchroscope:()=>`<div class="note">Sync scope for paralleling</div>`,
      generatorprotection:()=>`<div class="note">Generator protection: ${(Array.isArray(c.functions)?c.functions:[]).length} functions</div>`,
      deaerator:()=>fld('Efficiency (%)',nI('efficiency',c.efficiency,0.9,1,0.01)),
      lpsystem:()=>fld('Pressure (bar)',nI('pressure',c.pressure,1,10,1)),
      hpsystem:()=>fld('Pressure (bar)',nI('pressure',c.pressure,100,200,10)),
      feedwatertank:()=>fld('Level (%)',nI('level',c.level,0,100,1)),
      blowdown:()=>`<div class="row"><button data-act="click">Open/Close</button></div>`,
      expansionjoint:()=>fld('Expansion (mm)',nI('expansion',c.expansion,0,60,1)),
      flange:()=>fld('Size (mm)',nI('size',c.size,50,500,10))+fld('Rating (bar)',nI('rating',c.rating,100,500,10)),
      gasket:()=>fld('Material',sI('material',c.material,[['PTFE','PTFE'],['Rubber','Rubber'],['Metal','Metal']]))+fld('Thickness (mm)',nI('thickness',c.thickness,1,10,0.5)),
      pipesupport:()=>fld('Type',sI('type',c.type,[['fixed','Fixed'],['spring','Spring'],['roller','Roller']]))+fld('Load (kg)',nI('load',c.load,0,1000,10)),
      reducer:()=>fld('Size In (mm)',nI('sizeIn',c.sizeIn,50,500,10))+fld('Size Out (mm)',nI('sizeOut',c.sizeOut,50,500,10)),
      teejoint:()=>fld('Size (mm)',nI('size',c.size,50,500,10)),
      elbow90:()=>fld('Size (mm)',nI('size',c.size,50,500,10)),
      elbow45:()=>fld('Size (mm)',nI('size',c.size,50,500,10)),
      deaerator:()=>fld('Efficiency (%)',nI('efficiency',c.efficiency,0.9,1,0.01)),
      lpsystem:()=>fld('Pressure (bar)',nI('pressure',c.pressure,1,10,1)),
      hpsystem:()=>fld('Pressure (bar)',nI('pressure',c.pressure,100,200,10)),
      feedwatertank:()=>fld('Level (%)',nI('level',c.level,0,100,1)),
      steamseparator:()=>fld('Efficiency (%)',nI('efficiency',c.efficiency,0.8,1,0.01)),
      economizer:()=>fld('Efficiency (%)',nI('efficiency',c.efficiency,0.7,0.95,0.01)),
      superheater:()=>fld('Temperature (°C)',nI('temperature',c.temperature,400,600,10)),
      reheater:()=>fld('Temperature (°C)',nI('temperature',c.temperature,400,600,10)),
      steampipe:()=>fld('Diameter (mm)',nI('diameter',c.diameter,50,500,10)),

      tap:()=>fld('Open',cI('open',c.open))+fld('Draw (%/s of tank)',nI('flow',c.flow,0,5,.1))
    };
    h+=(T[c.type]||(()=>''))();
    h+=`<div class="row"><button data-act="rot">⟳ Rotate</button><button data-act="dup">⧉ Duplicate</button><button class="danger" data-act="del">Delete</button></div>`;
  }
  el.innerHTML=h;
  updateFooter();
}
$('props').addEventListener('change',e=>{const t=e.target,k=t.dataset.k;if(!k)return;const o=selObj();if(!o)return;pushUndo();
  o[k]=t.dataset.t==='n'?(parseFloat(t.value)||0):t.dataset.t==='b'?t.checked:t.value;
  if(k==='broken')log(`Wire ${o.broken?'cut (open fault)':'restored'}`);if(k==='fault')log(`${o.label}: fault = ${o.fault}`);});
$('props').addEventListener('input',e=>{const t=e.target,k=t.dataset.k;if(!k)return;const o=selObj();if(!o)return;
  if(t.dataset.t==='t')o[k]=t.value;else if(t.type==='range'){o[k]=parseFloat(t.value);if(o.type==='valve'&&k==='flowPercent'){const note=t.parentElement.querySelector('.note');if(note)note.innerHTML=`<b>${Math.round(o.flowPercent)}% open</b> · 0% = fully closed · 100% = fully open`;}}});
$('props').addEventListener('click',e=>{const a=e.target.dataset.act;if(!a)return;const o=selObj();
  if(a==='del')delSel();else if(a==='rot'){rotSel();}else if(a==='dup')dupSel();
  else if(a==='click'&&o)clickAction(o);else if(a==='selectorPrev'&&o&&o.type==='selector'){pushUndo();o.position=((Number(o.position)||0)+3)%4;renderProps();}else if(a==='selectorNext'&&o&&o.type==='selector'){pushUndo();o.position=((Number(o.position)||0)+1)%4;renderProps();}else if(a==='resetmeter'&&o&&o.type==='energymeter'){pushUndo();o.kwh=0;log(`${o.label} energy counter reset`);renderProps();}else if(a==='resetgas'&&o&&o.type==='gasmeter'){pushUndo();o.total=0;log(`${o.label} volume counter reset`);renderProps();}else if(a==='resetcutoff'&&o&&o.type==='pressurecutoff'){pushUndo();o.tripped=false;o.pressure=0;o.peakPressure=0;log(`${o.label} manually reset — verify pressure before restarting`);renderProps();}else if(a==='resettimer'&&o&&o.type==='timer'){pushUndo();o.elapsed=0;o.output=false;o.remaining=o.delay;log(`${o.label} timer reset`);renderProps();}else if(a==='clearpts'&&o){pushUndo();o.pts=[];o.bend=0;renderProps();}
  else if(a==='addbend'&&o&&selected&&selected.kind==='w'){const P=routeWire(o);if(P&&P.length>1){let best=0,dist=0;for(let i=0;i<P.length-1;i++){const d=Math.hypot(P[i+1].x-P[i].x,P[i+1].y-P[i].y);if(d>dist){dist=d;best=i;}}const a=P[best],b=P[best+1];pushUndo();o.pts=o.pts||[];o.pts.push({x:snap((a.x+b.x)/2),y:snap((a.y+b.y)/2)});renderProps();}}else if(a==='click'&&(o.type==='expansionjoint'||o.type==='flange'||o.type==='gasket'||o.type==='pipesupport'||o.type==='reducer'||o.type==='teejoint'||o.type==='elbow90'||o.type==='elbow45')){log(`${o.label}: component inspected`);renderProps();}});

/* ───────────── live readouts ───────────── */
function describe(c){
  switch(c.type){
    case'motor':return`Flow  : ${(c.flow||0).toFixed(1)} %/s\nState : ${c.powered?(c.startT<1.5&&c.fault!=='stall'?'starting':'running'):'stopped'}\nCurrent: ${c.I?c.I.toFixed(1):'0.0'} A\nRated : ${(c.hp*746/c.eff/(sim.volts||220)/c.pf).toFixed(2)} A`;
    case'gearpump':return`Drive : ${c.drive==='shaft'?'SHAFT':c.drive==='motor'?'MOTOR (L/N)':'none'} · ${c.rpm||0} rpm\nFlow  : ${(c.flow||0).toFixed(1)} %/s · ${((c.flow||0)*600).toFixed(0)} L/min\nPressure: ${(c.pressure||0).toFixed(1)} bar\nCurrent: ${c.I?c.I.toFixed(1):'0.0'} A${c.powered?'':'\nState : stopped'}`;
    case'silo':return`Level: ${c.level.toFixed(1)}%\nIn: ${(c._in||0).toFixed(2)} · Out: ${(c._out||0).toFixed(2)}\n${c.overflow?'OVERFLOWING':(c._in||0)>(c._out||0)+c.drain?'FILLING':(c._out||0)>0?'SUPPLYING / DRAINING':'IDLE'}`;
    case'silopump':return`Level: ${c.level.toFixed(1)}%\nPump : ${c.powered?'RUNNING':'stopped'} · ${c.rpm||0} rpm\nDischarge: ${(c.pressure||0).toFixed(1)} bar · flow ${(c.flow||0).toFixed(2)} %/s\nCurrent: ${c.I?c.I.toFixed(1):'0.0'} A`;
    case'contactor':return`Coil : ${c.coilOn?'energised':'off'}\nMain contacts: ${c.coilOn||c.fault==='weld'?'closed':'open'}`;
    case'float':return`Float: ${c.up?'UP':'DOWN'}\nCOM–${floatPos(c)} closed`;
    case'mcb':case'rcd':case'acbreaker':case'dcbreaker':return`Status: ${c.tripped?'TRIPPED':c.closed?'closed':'open'}`+(c.type==='mcb'||c.type==='acbreaker'||c.type==='dcbreaker'?`\nThermal: ${Math.min(100,c.heat/3*100).toFixed(0)}%`:'');
    case'overload':return`Status: ${c.tripped?'TRIPPED':'ok'}\nThermal: ${Math.min(100,c.heat/3*100).toFixed(0)}%`;
    case'tank':return`Level: ${c.level.toFixed(1)}%\nIn: ${(c._in||0).toFixed(2)} · Out: ${(c._out||0).toFixed(2)}\n${c.overflow?'OVERFLOWING':(c._in||0)>(c._out||0)+c.drain?'FILLING':(c._out||0)>0?'SUPPLYING / DRAINING':'IDLE'}`;
    case'sump':return`Level: ${c.unlimited?'unlimited':c.level.toFixed(0)+'%'}`;
    case'valve':return`Control valve: ${(c.flowPercent??25)<=0?'CLOSED':(c.flowPercent??25)>=100?'FULLY OPEN':'THROTTLED'}\nOpening: ${Math.round(c.flowPercent??25)}%\nFlow: ${sim.pumping.toFixed(3)} tank-level %/s (whole model)`;
    case'tap':return`Tap: ${!c.open?'closed':c.running?'drawing water':'open, no supply'}`;
    case'gauge':return`Service: ${(c.fluid||'none').toUpperCase()}\nPressure: ${(c.pressure||0).toFixed(2)} bar\nScale: 0–${c.max} bar`;
    case'flowmeter':return`Service: ${(c.fluid||'none').toUpperCase()}\nFlow: ${(c.flow||0).toFixed(2)} ${c.unit||'L/min'}\nTotal: ${(c.total||0).toFixed(2)}`;
    case'tempgauge':return`Service: ${(c.fluid||'none').toUpperCase()}\nTemperature: ${(c.temperature||20).toFixed(1)} °C`;
    case'levelgauge':return`Service: ${(c.fluid||'none').toUpperCase()}\nLevel: ${(c.level||0).toFixed(1)}%\nScale: 0–${c.max||100}%`;
    case'dpgauge':return`Service: ${(c.fluid||'none').toUpperCase()}\nDifferential pressure: ${(c.pressure||0).toFixed(2)} bar`;
    case'vacuumgauge':return`Service: ${(c.fluid||'none').toUpperCase()}\nVacuum: ${(c.pressure||0).toFixed(3)} bar`;
    case'rotameter':return`Service: ${(c.fluid||'none').toUpperCase()}\nFlow: ${(c.flow||0).toFixed(2)} ${c.unit||'L/min'}\nTotal: ${(c.total||0).toFixed(2)}`;
    case'checkvalve':return`Direction: IN → OUT\nState: ${c.open?'forward flow':'closed / no forward flow'}`;
    case'reliefvalve':return`Setting: ${c.setting} bar\nInlet pressure: ${(c.pressure||0).toFixed(2)} bar\nState: ${c.open?'OPEN — relieving':'CLOSED'}`;
    case'pressurecutoff':return`Trip setting: ${c.setting} bar\nInlet pressure: ${(c.pressure||0).toFixed(2)} bar\nPeak pressure: ${(c.peakPressure||0).toFixed(2)} bar\nState: ${c.tripped?'TRIPPED — supply isolated':'OPEN — flow permitted'}`;
    case'timer':return`Mode: ${c.mode}\nCoil: ${c.coilOn?'energised':'de-energised'}\nElapsed: ${(c.elapsed||0).toFixed(1)} / ${Number(c.delay||0).toFixed(1)} s\nRemaining: ${(c.remaining||0).toFixed(1)} s\nOutput: ${c.output?'ON (COM–NO)':'OFF (COM–NC)'}`;
    case'accumulator':return`Pressure: ${(c.pressure||0).toFixed(2)} bar\nPrecharge: ${c.precharge} bar\nFluid: ${(c.fluid*100).toFixed(0)}%`;
    case'filter':return`Condition: ${c.clogged?'clogged':'clean'}\nPressure drop: ${(c.pressureDrop||0).toFixed(2)} bar`;
    case'manifold':return`Ports: 1 inlet / 3 outlets\nOutlets wired: ${c.connectedOutlets||0}/3\nInlet pressure: ${(c.pressure||0).toFixed(2)} bar\nState: ${c.flowing?'pressurised / flowing':'no detected flow'}`;
    case'lamp':return`State: ${c.powered?'lit':'off'}`;
    case'solar':return`Irradiance: ${Math.round(c._irradiance||0)} W/m²\nOutput: ${(c.outputPower||0).toFixed(0)} W / ${c.watts} W\nCell: ${(c._cellTemp||25).toFixed(0)}°C · ${(c.current||0).toFixed(2)} A\nStatus: ${c.status||'—'}${c.fault&&c.fault!=='none'?'\nFault: '+c.fault:''}`;
    case'battery':return`SOC: ${(c.soc||0).toFixed(1)}%\nVoltage: ${(c.voltage||12).toFixed(1)} V\nCapacity: ${c.capacity} Ah\nState: ${c.charging?'CHARGING':c.discharging?'DISCHARGING':'IDLE'}`;
    case'batterycharger':return`Status: ${c.status||'OFFLINE'}\nAC input: ${c.acVoltage} V / ${c.frequency} Hz\nDC output: ${c.dcVoltage} V\nOutput current: ${Number(c.outputCurrent||0).toFixed(2)} A\nInput current: ${Number(c.inputCurrent||0).toFixed(2)} A`; 
    case'hybrid':return`Status: ${c.status||'-'}\nSource: ${c._src||'-'}\nPV input: ${Math.round(c.pvW||0)} W\nAC load: ${Math.round(c.loadW||0)} W of ${c.rating} W\nBattery draw: ${Math.round(c._dcW||0)} W\nBattery charge: ${Math.round(c._chgW||0)} W`;
    case'inverter':return`Status: ${c.status||(c.on?'ON':'OFF')}\nMode: ${c.mode||'-'}\nAC load: ${Math.round(c.loadW||0)} W of ${c.rating} W\nDC draw: ${Math.round(c._dcW||0)} W\nCharging: ${c._chgW>0?c.chargeCurrent+' A max ('+Math.round(c._chgW)+' W)':'no'}\nEfficiency: ${(c.efficiency*100).toFixed(0)}%`;
    case'chargecontroller':return`Status: ${c.on?'ACTIVE':'STANDBY'}\nMode: ${(c.mode||'mppt').toUpperCase()}\nBulk voltage: ${c.bulkVoltage} V\nFloat voltage: ${c.floatVoltage} V`;
    case'dcsource':return`Status: ${c.on?'ON':'OFF'}\nOutput: ${c.volts}V DC\nCurrent: ${c.current}A`;
    case'generator':return`Status: ${c.on?'RUNNING':'STOPPED'}\nPower: ${c.kva}kVA\nFuel: ${c.fuel.toFixed(1)}%\nOutput: ${(c.outputPower||0).toFixed(0)}W`;
    case'transformer':return`Primary: ${c.priVolts}V\nSecondary: ${c.secVolts}V\nRatio: ${c.priVolts}:${c.secVolts}\nPower: ${c.kva}kVA`;
    case'wind':return`Mean wind: ${(c.windSpeed||0).toFixed(1)} m/s\nInstant: ${(c._instWind||0).toFixed(1)} m/s\nOutput: ${(c.outputPower||0).toFixed(0)} W / ${c.power} W\nRotor: ${Math.round(c.rpm||0)} rpm · Ø ${c.rotorDiameter||'?'} m\nStatus: ${c.status||'—'}${c.fault&&c.fault!=='none'?'\nFault: '+c.fault:''}`;
    case'capacitorbank':return`Rating: ${c.kvar}kVAR\nVoltage: ${c.voltage}V\nStatus: ${c.connected?'CONNECTED':'DISCONNECTED'}`;
    case'supercap':return`Capacitance: ${c.farads}F\nVoltage: ${c.voltage.toFixed(1)}V\nSOC: ${(c.soc||0).toFixed(1)}%`;
    case'fuse':return`Rating: ${c.rating}A\nStatus: ${c.blown?'BLOWN':'OK'}`;
    case'spd':return`Type: ${c.type.toUpperCase()}\nStatus: ${c.status}`;
    case'earthrod':return`Resistance: ${c.resistance}Ω\nGround connection`;
    case'lightning':return`Status: ${c.status}\nLightning protection`;
    case'relay':return`Coil: ${c.coilOn?'ENERGIZED':'OFF'}\nContact: ${c.contact.toUpperCase()}\nOutput: ${c.coilOn?'CLOSED':'OPEN'}`;
    case'ssr':return`Status: ${c.on?'ON':'OFF'}\nRating: ${c.rating}A\nSolid state relay`;
    case'selector':return`Position: ${c.position}\nContacts: POS1, POS2, POS3`;
    case'transfer':return`Position: ${c.position.toUpperCase()}\nNormal source: ${c.position==='norm'?'CONNECTED':'DISCONNECTED'}\nEmergency source: ${c.position==='emer'?'CONNECTED':'DISCONNECTED'}`;
    case'disconnect':return`Status: ${c.closed?'CLOSED':'OPEN'}\nIsolation switch`;
    case'plc':return`Program: ${c.program.toUpperCase()}\nScan time: ${c.scanTime}ms\nI1: ${c.input1?'ON':'OFF'}\nI2: ${c.input2?'ON':'OFF'}\nO1: ${c.output1?'ON':'OFF'}\nO2: ${c.output2?'ON':'OFF'}`;
    case'vfd':return`Status: ${c.on?'RUNNING':'STOPPED'}\nFrequency: ${c.hz}Hz\nRPM: ${c.rpm}\nTorque: ${c.torque}%\nCurrent: ${c.amps}A`;
    case'softstart':return`Status: ${c.on?'RUNNING':'STOPPED'}\nRamp time: ${c.rampTime}s\nCurrent limit: ${c.currentLimit}%`;
    case'pid':return`Mode: ${c.mode.toUpperCase()}\nSetpoint: ${c.setpoint}\nPV: ${c.pv.toFixed(1)}\nOutput: ${c.output.toFixed(1)}%\nKp: ${c.kp}\nKi: ${c.ki}\nKd: ${c.kd}`;
    case'ct':return`Ratio: ${c.ratio}\nPrimary: ${(c.primary||0).toFixed(1)}A\nSecondary: ${(c.secondary||0).toFixed(2)}A`;
    case'vt':return`Ratio: ${c.ratio}\nPrimary: ${(c.primary||0).toFixed(0)}V\nSecondary: ${(c.secondary||0).toFixed(1)}V`;
    case'energymeter':return`Total: ${c.kwh.toFixed(2)}kWh\nPower: ${c.kw.toFixed(2)}kW\nVoltage: ${c.voltage}V\nCurrent: ${c.current.toFixed(1)}A\nPF: ${c.pf.toFixed(2)}`;
    case'pfccap':return`Rating: ${c.kvar}kVAR\nVoltage: ${c.voltage}V\nStatus: ${c.connected?'CONNECTED':'DISCONNECTED'}`;
    case'heater':return`Power: ${c.watts}W\nTemperature: ${c.temperature.toFixed(1)}°C\nStatus: ${c.powered?'HEATING':'OFF'}`;
    case'fan':return`Power: ${c.watts}W\nSpeed: ${c.speed.toFixed(0)}%\nStatus: ${c.powered?'RUNNING':'OFF'}`;
    case'ledstrip':return`Power: ${c.watts}W\nLEDs: ${c.leds}\nBrightness: ${c.brightness.toFixed(0)}%\nStatus: ${c.powered?'ON':'OFF'}`;
    case'solenoid':return`Power: ${c.watts}W\nStatus: ${c.open?'OPEN':'CLOSED'}\n${c.powered?'ENERGIZED':'OFF'}`;
    case'gasturbine':return`Status: ${c.on?'RUNNING':'STOPPED'}\nPower: ${c.mw}MW\nRPM: ${c.rpm}\nFuel: ${c.fuel.toFixed(1)}%\nEfficiency: ${(c.efficiency*100).toFixed(0)}%\nTemp: ${c.temperature.toFixed(0)}°C`;
    case'steamturbine':return`Status: ${c.on?'RUNNING':'STOPPED'}\nPower: ${c.mw}MW\nRPM: ${c.rpm}\nPressure: ${c.pressure} bar\nTemp: ${c.temperature.toFixed(0)}°C`;
    case'boiler':return`Status: ${c.on?'ACTIVE':'OFF'}\nPressure: ${c.pressure} bar\nTemp: ${c.temperature.toFixed(0)}°C\nWater: ${c.waterLevel.toFixed(0)}%\nFuel rate: ${c.fuelRate}`;
    case'condenser':return`Pressure: ${c.pressure} bar\nTemp: ${c.temperature.toFixed(0)}°C\nCooling: ${c.cooling}%`;
    case'coolingtower':return`Capacity: ${c.capacity}%\nFan speed: ${c.fanSpeed.toFixed(0)}%`;
    case'governor':return`Setpoint: ${c.setpoint} RPM\nDeadband: ${c.deadband} RPM\nOutput: ${c.output}%`;
    case'exciter':return`Voltage: ${c.voltage}V\nCurrent: ${c.current}A`;
    case'syncrelay':return`Status: ${c.synced?'SYNCED':'OPEN'}\nVoltage match: ${c.voltageMatch?'YES':'NO'}\nFreq match: ${c.freqMatch?'YES':'NO'}`;
    case'busbar':return`Voltage: ${c.voltage}V\nCurrent: ${c.current.toFixed(0)}A`;
    case'hvbreaker':return`Status: ${c.tripped?'TRIPPED':c.closed?'CLOSED':'OPEN'}\nRating: ${c.rating}A\nVoltage: ${c.kv}kV`;
    case'transformerhv':return`Primary: ${c.priKv}kV\nSecondary: ${c.secKv}kV\nPower: ${c.mva}MVA\nRatio: ${c.ratio}`;
    case'reactor':return`MVAR: ${c.mvar}\nReactance: ${c.x}\nRated: ${c.ratedV}kV`;
    case'gascompressor':return`Status: ${c.on?'RUNNING':'STOPPED'}\nPressure: ${c.pressure} bar\nFlow: ${c.flow} m³/h\nEfficiency: ${(c.efficiency*100).toFixed(0)}%`;
    case'gasboosterpump':return`Status: ${c.on?(c.powered?'RUNNING':'NO POWER'):'STOPPED'}\nPressure: ${(c.pressure||0).toFixed(0)} bar\nFlow: ${(c.flow||0).toFixed(0)} m³/h\nGas at IN: ${c._supplied?'YES':'NO'}`;
    case'steamboosterpump':return`Status: ${c.on?(c.powered?'RUNNING':'NO POWER'):'STOPPED'}\nPressure: ${(c.pressure||0).toFixed(0)} bar\nFlow: ${(c.flow||0).toFixed(0)} kg/h\nSteam at IN: ${c._supplied?'YES':'NO'}`;
    case'airsupply':{const sp=Math.round((c._spd||0)*100);return`Status: ${c.unlimited?'UNLIMITED (ambient)':c.cutout?'THERMAL CUT-OUT':c.fault==='open'?'OPEN WINDING':c.fault==='stall'?'JAMMED ROTOR':!c.on?'OFF':!c.powered?'NO POWER (check L / N)':sp<60?'SPINNING UP':'SUPPLYING AIR'}\nSupply: ${c.unlimited?'not required':c.powered?(sim.volts||230)+' V present':'none at L–N'}\nBlower speed: ${c.unlimited?'—':sp+' %'}\nPressure: ${(c.unlimited?1.013:+(c.pressure*(c._spd||0)).toFixed(2))} bar\nFlow: ${c.unlimited?'∞':Math.round(c.flow*(c._spd||0))} m³/h\nAir: ${(c.temperature??25)}°C · ${(c.humidity??45)}%RH\nMotor: ${(c.powerKw??5.5)} kW · ${(+(c.I||0)).toFixed(1)} A`;}
    case'fluestack':return`Flue gas inlet: ${c._receiving?'RECEIVING EXHAUST':'IDLE'}`;
    case'economizer':case'superheater':case'reheater':return`Flue gas at FLUE_IN: ${c._fin?'YES':'NO'}\nFLUE_OUT to stack: ${c._fout?'YES':'NO'}\nHeat transfer: ${c._fin&&c._fout?'ACTIVE':'BLOCKED'}`;
    case'gasvalve':return`Status: ${c.open?'OPEN':'CLOSED'}\nOpening: ${Math.round(c.opening??100)}%\nGas control valve`;
    case'gasfilter':return`Status: ${c.clogged?'CLOGGED':'OK'}\nGas filter`;
    case'gasmeter':return`Flow: ${c.flow.toFixed(0)} m³/h\nTotal: ${c.total.toFixed(0)} m³\nPressure: ${c.pressure} bar`;
    case'pressureregulator':return`Setpoint: ${c.setpoint} bar\nOutput: ${c.output} bar`;
    case'gastank':return`Level: ${c.level.toFixed(0)}%\nPressure: ${c.pressure} bar\nCapacity: ${c.capacity} m³`;
    case'gaswell':return`Status: ${c.on?'ACTIVE':'STOPPED'}\nPressure: ${c.pressure} bar\nFlow: ${c.flow} m³/h\nTemp: ${c.temperature}°C`;
    case'naturalgas':return`Status: ${c.on?'ON':'OFF'}\nPressure: ${c.pressure} bar\nFlow: ${c.flow} m³/h\nMethane: ${(c.methane*100).toFixed(0)}%`;
    case'lpgtank':return`Level: ${c.level.toFixed(0)}%\nPressure: ${c.pressure} bar\nTemp: ${c.temperature}°C`;
    case'burner':return`Status: ${c.on?'BURNING':'OFF'}\nFlame temp: ${c.flameTemp}°C\nEfficiency: ${(c.efficiency*100).toFixed(0)}%`;
    case'combustionchamber':return`Status: ${c.on?'COMBUSTING':'OFF'}\nTemp: ${c.temperature}°C\nPressure: ${c.pressure} bar`;
    case'steamsource':return`Status: ${c.on?'ON':'OFF'}\nPressure: ${c.pressure} bar\nTemp: ${c.temperature}°C\nFlow: ${c.flow} t/h`;
    case'steamgenerator':return`Status: ${c.on?'GENERATING':'OFF'}\nPressure: ${c.pressure} bar\nTemp: ${c.temperature}°C\nEfficiency: ${(c.efficiency*100).toFixed(0)}%`;
    case'flame':return`Status: ${c.on?'BURNING':'OFF'}\nTemp: ${c.temperature}°C`;
    case'furnace':return`Status: ${c.on?'HEATING':'OFF'}\nTemp: ${c.temperature}°C\nEfficiency: ${(c.efficiency*100).toFixed(0)}%`;
    case'steampipe':return`Diameter: ${c.diameter} mm\nPressure: ${c.pressure} bar\nTemp: ${c.temperature}°C`;
    case'steamtrap':return`Status: ${c.open?'OPEN':'CLOSED'}\nCondensate: ${c.condensate.toFixed(0)}%`;
    case'steamseparator':return`Efficiency: ${(c.efficiency*100).toFixed(0)}%\nSteam/water separation`;
    case'feedwaterpump':return`Status: ${c.on?'RUNNING':'STOPPED'}\nFlow: ${c.flow} m³/h\nPressure: ${c.pressure} bar`;
    case'economizer':return`Efficiency: ${(c.efficiency*100).toFixed(0)}%\nHeat recovery`;
    case'superheater':return`Temperature: ${c.temperature.toFixed(0)}°C\nEfficiency: ${(c.efficiency*100).toFixed(0)}%`;
    case'reheater':return`Temperature: ${c.temperature.toFixed(0)}°C\nEfficiency: ${(c.efficiency*100).toFixed(0)}%`;
    case'gatevalve':return`Status: ${c.open?'OPEN':'CLOSED'}\nOpening: ${Math.round(c.opening??100)}%\nGate valve`;
    case'globevalve':return`Status: ${c.open?'OPEN':'CLOSED'}\nOpening: ${Math.round(c.opening??100)}%\nGlobe valve`;
    case'ballvalve':return`Status: ${c.open?'OPEN':'CLOSED'}\nOpening: ${Math.round(c.opening??100)}%\nBall valve`;
    case'butterflyvalve':return`Status: ${c.open?'OPEN':'CLOSED'}\nOpening: ${Math.round(c.opening??100)}%\nButterfly valve`;
    case'expansionjoint':return`Expansion: ${c.expansion.toFixed(0)} mm\nThermal expansion`;
    case'flange':return`Size: ${c.size} mm\nRating: ${c.rating} bar`;
    case'gasket':return`Material: ${c.material}\nThickness: ${c.thickness} mm`;
    case'pipesupport':return`Type: ${c.type}\nLoad: ${c.load} kg`;
    case'reducer':return`Size: ${c.sizeIn}→${c.sizeOut} mm\nReducer`;
    case'teejoint':return`Size: ${c.size} mm\nTee joint`;
    case'elbow90':return`Size: ${c.size} mm\n90° elbow`;
    case'elbow45':return`Size: ${c.size} mm\n45° elbow`;
    case'expansionjoint':return`Expansion: ${c.expansion.toFixed(0)} mm\nThermal expansion`;
    case'flange':return`Size: ${c.size} mm\nRating: ${c.rating} bar`;
    case'gasket':return`Material: ${c.material}\nThickness: ${c.thickness} mm`;
    case'pipesupport':return`Type: ${c.type}\nLoad: ${c.load} kg`;
    case'avr':return`Setpoint: ${c.setpoint}V\nExcitation: ${c.excitation}%\nMode: ${c.mode}`;
    case'deaerator':return`Efficiency: ${(c.efficiency*100).toFixed(0)}%\nTemperature: ${c.temperature}°C`;
    case'lpsystem':return`Pressure: ${c.pressure} bar\nTemp: ${c.temperature}°C\nLow pressure system`;
    case'hpsystem':return`Pressure: ${c.pressure} bar\nTemp: ${c.temperature}°C\nHigh pressure system`;
    case'feedwatertank':return`Level: ${c.level.toFixed(0)}%\nTemp: ${c.temperature}°C\nFeedwater storage`;
    case'steamseparator':return`Efficiency: ${(c.efficiency*100).toFixed(0)}%\nSteam/water separation`;
    case'economizer':return`Efficiency: ${(c.efficiency*100).toFixed(0)}%\nHeat recovery`;
    case'superheater':return`Temperature: ${c.temperature.toFixed(0)}°C\nEfficiency: ${(c.efficiency*100).toFixed(0)}%`;
    case'reheater':return`Temperature: ${c.temperature.toFixed(0)}°C\nEfficiency: ${(c.efficiency*100).toFixed(0)}%`;
    case'differentialrelay':return`Status: ${c.tripped?'TRIPPED':'OK'}\nSetting: ${c.setting}`;
    case'overcurrentrelay':return`Status: ${c.tripped?'TRIPPED':'OK'}\nSetting: ${c.setting}x\nDelay: ${c.timeDelay}s`;
    case'distanceprotection':return`Zone 1: ${c.zone1} pu\nZone 2: ${c.zone2} pu\nZone 3: ${c.zone3} pu`;
    case'synchroscope':return`Angle: ${c.angle.toFixed(0)}°\nFreq diff: ${c.freqDiff.toFixed(2)} Hz\nVolt diff: ${c.voltDiff.toFixed(0)}V`;
    case'generatorprotection':return`Functions: ${c.functions.length}\nProtection system`;
    case'deaerator':return`Efficiency: ${(c.efficiency*100).toFixed(0)}%\nTemperature: ${c.temperature}°C`;
    case'lpsystem':return`Pressure: ${c.pressure} bar\nTemp: ${c.temperature}°C\nLow pressure system`;
    case'hpsystem':return`Pressure: ${c.pressure} bar\nTemp: ${c.temperature}°C\nHigh pressure system`;
    case'feedwatertank':return`Level: ${c.level.toFixed(0)}%\nTemp: ${c.temperature}°C\nFeedwater storage`;
    case'blowdown':return`Status: ${c.open?'OPEN':'CLOSED'}\nRate: ${c.rate}%`;
    default:return'';}
}
setInterval(()=>{
  $('kV').textContent=sim.volts?sim.volts+' V':'OFF';$('kI').textContent=sim.totalI.toFixed(1)+' A';$('kP').textContent=Math.round(sim.power)+' W';
  const tk=comps.find(c=>['tank','silo','silopump'].includes(c.type));$('kT').textContent=tk?tk.level.toFixed(0)+'%':'—';
  const zn=comps.find(c=>c.type==='hvaczone');$('kZ').textContent=zn?(zn.temperature||20).toFixed(1)+' °C':'—';
  const cool=comps.find(c=>c.type==='chiller'||c.type==='refrigcompressor'||c.type==='dxevaporator');
  $('kC').textContent=cool&&(cool._cooling||cool.kw||cool.tons)?((cool._cooling||((cool.tons||0)*3.517)||cool.kw||0).toFixed(1)+' kW'):'—';
  const c=selected&&selected.kind==='c'?getC(selected.id):null;$('live').textContent=c?describe(c):'';
  const al=sim.alarms.length?sim.alarms:(sim.st&&comps.some(c=>c.type==='source')?[['ok','Circuit healthy']]:[]);
  $('alarms').innerHTML=al.map(a=>`<span class="chip ${a[0]}">${esc(a[1])}</span>`).join('');
},16);

/* ───────────── toolbar ───────────── */
$('bRun').onclick=()=>{sim.running=!sim.running;$('bRun').textContent=sim.running?'⏸ Pause':'▶ Run';$('bRun').className=sim.running?'on':'stop';log(sim.running?'Simulation running.':'Simulation paused.');};
$('bReset').onclick=resetSim;$('bUndo').onclick=undo;$('bRedo').onclick=redo;$('bRot').onclick=rotSel;$('bDup').onclick=dupSel;$('bDel').onclick=delSel;
$('bClear').onclick=()=>{if(!comps.length||confirm('Clear the whole board?')){pushUndo();comps=[];wires=[];selected=null;renderProps();}};
$('bTpl').onclick=loadTemplate;$('bZi').onclick=()=>zoomBy(1.2);$('bZo').onclick=()=>zoomBy(1/1.2);$('bFit').onclick=fit;
$('speed').oninput=e=>{sim.speed=+e.target.value;$('speedV').textContent=sim.speed+'×';};
$('bSave').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([typeof savePayload==='function'?savePayload():JSON.stringify({v:1,comps,wires,nextId},null,1)],{type:'application/json'}));a.download='circuit.json';a.click();URL.revokeObjectURL(a.href);};
$('bLoad').onclick=()=>$('file').click();
$('file').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{pushUndo();loadObj(JSON.parse(r.result));fit();log('Circuit loaded from file.');}catch(err){alert('Could not read that file.');}};r.readAsText(f);e.target.value='';};
$('bClrLog').onclick=()=>{logs=[];renderLog();};
$('bExpLog').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([logs.slice().reverse().join('\n')||'No events.'],{type:'text/plain'}));a.download='circuit-log.txt';a.click();URL.revokeObjectURL(a.href);};

/* ───────────── main loop ───────────── */
function frame(now){fdt=Math.min(.05,(now-lastT)/1000);lastT=now;if(sim.running)step(fdt*sim.speed);else if(!sim.st)step(0);draw(now);requestAnimationFrame(frame);}
(function init(){
  resize();let loaded=false;
  try{const s=localStorage.getItem('circuitLab.v1');if(s){const o=JSON.parse(s);if(o.comps&&o.comps.length){loadObj(o);loaded=true;fit();}}}catch(e){}
  if(!loaded){loadTemplate();undoStack=[];}
  renderLog();log('Circuit Lab ready. Drag parts in, wire terminals, and watch the solver respond.');
  requestAnimationFrame(frame);
})();
