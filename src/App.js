import React, { useEffect, useMemo, useRef, useState } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

/**
 * SensorMap_uPlot.jsx (raw-signal version)
 * - Uses the raw signal without any additional filtering.
 * - Parses metadata columns at the end of CSVs and shows a note describing
 *   the preprocessing filter that produced the file.
 * - Recreates uPlot whenever selectedSensors set changes (series count/labels).
 * - Updates data/range via setData/setScale for window changes.
 * - Canvas map stays on rAF. Chart has 24fps CSS overlay playhead.
 * Install:  npm i uplot
 */

// ----------------------------
// 1) Sensor layout (unchanged)
// ----------------------------
const pcb_100 = { name: "100", esp: "ESP1", points: { "1": { x: 1, y: 0 }, "2": { x: 2, y: 0 }, "3": { x: 2, y: 1 }, "4": { x: 3, y: 1 }, "5": { x: 3, y: 2 }, "6": { x: 4, y: 2 }, "7": { x: 4, y: 3 }, "8": { x: 5, y: 3 } } };
const pcb_101 = { name: "101", esp: "ESP2", points: { "1": { x: 7, y: 0 }, "2": { x: 8, y: 0 }, "3": { x: 7, y: 1 }, "4": { x: 8, y: 1 }, "5": { x: 6, y: 2 }, "6": { x: 7, y: 2 }, "7": { x: 6, y: 3 }, "8": { x: 5, y: 4 } } };
const pcb_102 = { name: "102", esp: "ESP3", points: { "1": { x: 3, y: 0 }, "2": { x: 4, y: 0 }, "3": { x: 5, y: 0 }, "4": { x: 6, y: 0 }, "5": { x: 4, y: 1 }, "6": { x: 5, y: 1 }, "7": { x: 6, y: 1 }, "8": { x: 5, y: 2 } } };
const pcb_103 = { name: "103", esp: "ESP4", points: { "1": { x: 9, y: 1 }, "2": { x: 9, y: 2 }, "3": { x: 8, y: 2 }, "4": { x: 8, y: 3 }, "5": { x: 7, y: 3 }, "6": { x: 7, y: 4 }, "7": { x: 6, y: 4 }, "8": { x: 6, y: 5 } } };
const pcb_104 = { name: "104", esp: "ESP5", points: { "1": { x: 9, y: 7 }, "2": { x: 9, y: 8 }, "3": { x: 8, y: 7 }, "4": { x: 8, y: 8 }, "5": { x: 7, y: 6 }, "6": { x: 7, y: 7 }, "7": { x: 6, y: 6 }, "8": { x: 5, y: 5 } } };
const pcb_105 = { name: "105", esp: "ESP6", points: { "1": { x: 9, y: 3 }, "2": { x: 9, y: 4 }, "3": { x: 9, y: 5 }, "4": { x: 9, y: 6 }, "5": { x: 8, y: 4 }, "6": { x: 8, y: 5 }, "7": { x: 8, y: 6 }, "8": { x: 7, y: 5 } } };
const pcb_106 = { name: "106", esp: "ESP7", points: { "1": { x: 8, y: 9 }, "2": { x: 7, y: 9 }, "3": { x: 7, y: 8 }, "4": { x: 6, y: 8 }, "5": { x: 6, y: 7 }, "6": { x: 5, y: 7 }, "7": { x: 5, y: 6 }, "8": { x: 4, y: 6 } } };
const pcb_107 = { name: "107", esp: "ESP8", points: { "1": { x: 2, y: 9 }, "2": { x: 1, y: 9 }, "3": { x: 2, y: 8 }, "4": { x: 1, y: 8 }, "5": { x: 2, y: 7 }, "6": { x: 3, y: 7 }, "7": { x: 3, y: 6 }, "8": { x: 4, y: 5 } } };
const pcb_108 = { name: "108", esp: "ESP9", points: { "1": { x: 6, y: 9 }, "2": { x: 5, y: 9 }, "3": { x: 4, y: 9 }, "4": { x: 3, y: 9 }, "5": { x: 5, y: 8 }, "6": { x: 4, y: 8 }, "7": { x: 3, y: 8 }, "8": { x: 4, y: 7 } } };
const pcb_109 = { name: "109", esp: "ESP10", points: { "1": { x: 0, y: 8 }, "2": { x: 0, y: 7 }, "3": { x: 1, y: 7 }, "4": { x: 1, y: 6 }, "5": { x: 2, y: 6 }, "6": { x: 2, y: 5 }, "7": { x: 3, y: 5 }, "8": { x: 3, y: 4 } } };
const pcb_110 = { name: "110", esp: "ESP11", points: { "1": { x: 0, y: 2 }, "2": { x: 0, y: 1 }, "3": { x: 1, y: 2 }, "4": { x: 1, y: 1 }, "5": { x: 2, y: 3 }, "6": { x: 2, y: 2 }, "7": { x: 3, y: 3 }, "8": { x: 4, y: 4 } } };
const pcb_111 = { name: "111", esp: "ESP12", points: { "1": { x: 0, y: 6 }, "2": { x: 0, y: 5 }, "3": { x: 0, y: 4 }, "4": { x: 0, y: 3 }, "5": { x: 1, y: 5 }, "6": { x: 1, y: 4 }, "7": { x: 1, y: 3 }, "8": { x: 2, y: 4 } } };

const BOARDS = [pcb_100, pcb_101, pcb_102, pcb_103, pcb_104, pcb_105, pcb_106, pcb_107, pcb_108, pcb_109, pcb_110, pcb_111];
const SENSORS = BOARDS.flatMap((b) => Object.entries(b.points).map(([ch, pt]) => ({ id: `${b.name}-${ch}`, board: b.name, esp: b.esp, grid: pt })));
const ESP_TO_BOARD = BOARDS.reduce((acc, b) => { acc[b.esp] = b.name; return acc; }, {});
function headerToSensorId(header) {
  if (!/^ESP\d+_Sensor\d+$/i.test(header)) return null;
  const [esp, sensorWord] = header.split("_");
  const ch = parseInt(sensorWord.replace(/[^0-9]/g, ""), 10);
  const board = ESP_TO_BOARD[esp];
  if (!board || !ch) return null;
  return `${board}-${ch}`;
}

// ----------------------------
// 2) Mock (raw; no extra filtering)
// ----------------------------
function mockSignals(sampleRate = 200, durationSec = 12) {
  const N = Math.floor(sampleRate * durationSec);
  const byId = new Map();
  for (const s of SENSORS) {
    const arr = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const t = i / sampleRate;
      arr[i] =
        Math.sin(2 * Math.PI * (0.6 + (parseInt(s.board) % 5) * 0.08) * t) * 0.6 +
        Math.cos(2 * Math.PI * 0.22 * t + (parseInt(s.id.split("-")[1]) % 5)) * 0.4;
    }
    subtractMeanInPlace(arr);
    byId.set(s.id, arr);
  }
  const ts = Float64Array.from({ length: N }, (_, i) => i / sampleRate);
  return { byId, sampleRate, durationSec, timestamps: ts };
}
function meanOf(arr){ let s=0; for(let i=0;i<arr.length;i++) s+=arr[i]; return arr.length? s/arr.length:0; }
function subtractMeanInPlace(arr){ const m=meanOf(arr); for(let i=0;i<arr.length;i++) arr[i]-=m; return arr; }

// ----------------------------
// 3) Helpers / colors
// ----------------------------
function fnv1a(str){ let h=0x811c9dc5; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=(h+((h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24)))>>>0; } return h>>>0; }
const GOLDEN_ANGLE=137.508;
function parseId(id){ const [board,chStr]=id.split("-"); return {board, ch:Number(chStr)||0}; }
function colorForId(id, s=72, l=52){ const {board,ch}=parseId(id); const baseHue=fnv1a(board)%360; const hue=(baseHue+ch*GOLDEN_ANGLE)%360; const light=l+((fnv1a(id)%5)-2); return `hsl(${hue} ${s}% ${Math.max(38, Math.min(62, light))}%)`; }
function colorForValue(v,vmin,vmax){ const t=Math.max(0,Math.min(1,(v-vmin)/(vmax-vmin||1))); const r=t<0.5? (t*2*255):255; const g=t<0.5? (t*2*255): (255-(t-0.5)*2*255); const b=t<0.5?255: (255-(t-0.5)*2*255); return `rgba(${r|0},${g|0},${b|0},0.95)`; }

export default function SensorMap_uPlot(){
  // ----- params -----
  const [timeWindowSec,setTimeWindowSec]=useState(5);
  const [selectedSensors,setSelectedSensors]=useState([SENSORS[0].id]);
  const [valueRange,setValueRange]=useState([-1,1]);
  const [pointRadius,setPointRadius]=useState(20);
  const [isPlaying,setIsPlaying]=useState(true);
  const [plotWidth, setPlotWidth] = useState(600);
  const [filterNote, setFilterNote] = useState(
    "Awaiting CSV… raw signals shown as-is. Will display filter metadata when available."
  );

  // ----- data -----
  const initial=useMemo(()=>mockSignals(200,12),[]);
  const [rawSignals,setRawSignals]=useState(()=>initial);

  // Signals = raw (no extra filtering)
  const signals = rawSignals;

  // ----- playhead (24fps) -----
  const [playheadSec,setPlayheadSec]=useState(0);
  useEffect(()=>{ 
    if(!isPlaying) return; 
    let mounted=true; 
    const iv=setInterval(()=>{ 
      if(!mounted) return; 
      setPlayheadSec((t)=>{ 
        const dur=signals?.durationSec??0; 
        if(dur<=0) return 0; 
        const dt=1/24; 
        const nt=t+dt; 
        return nt>=dur? 0: nt; 
      }); 
    }, 1000/24); 
    return ()=>{ 
      mounted=false; 
      clearInterval(iv); 
    }; 
  },[isPlaying, signals?.durationSec]);
  useEffect(()=>{ 
    const dur=signals?.durationSec??0; 
    if(playheadSec>dur) setPlayheadSec(0); 
  },[signals?.durationSec]);

  // ----- window bounds -----
  const windowBounds=useMemo(()=>{
    const dur=signals?.durationSec??0; 
    const w=Math.max(0.2, Math.min(timeWindowSec, Math.max(0.2,dur||10))); 
    const half=w/2;
    const start=Math.max(0, Math.min((playheadSec||0)-half, Math.max(0, (dur||0)-w))); 
    const end=Math.min(dur, start+w);
    return { start, end, dur, w };
  },[playheadSec, timeWindowSec, signals?.durationSec]);

  // 2a) Compute shared indices & xs for current window
  const windowSamplePlan = useMemo(()=>{
    if (!signals?.timestamps?.length) return { idxs: [], xs: [] };
    const ts = signals.timestamps;
    const N = ts.length;
    const left = (x)=>{ let lo=0,hi=N; while(lo<hi){ const mid=(lo+hi)>>1; if(ts[mid]<x) lo=mid+1; else hi=mid; } return lo; };
    const right=(x)=>{ let lo=0,hi=N; while(lo<hi){ const mid=(lo+hi)>>1; if(ts[mid]<=x) lo=mid+1; else hi=mid; } return lo; };
    const i0 = left(windowBounds.start);
    const i1 = Math.max(i0, right(windowBounds.end) - 1);

    // cap points to ~one per x pixel (adjust multiplier if you like)
    const px = Math.max(100, Math.floor((plotWidth || 600) * (window.devicePixelRatio || 1)));
    const span = Math.max(1, i1 - i0 + 1);
    const step = Math.max(1, Math.floor(span / px));

    const idxs = [];
    for (let i = i0; i <= i1; i += step) idxs.push(i);
    const xs = idxs.map(i => ts[i]);
    return { idxs, xs };
  }, [signals?.timestamps, windowBounds.start, windowBounds.end, plotWidth]); 
  // 2b) Build per-sensor ys using the shared indices
  const timeSeriesById = useMemo(()=>{
    const map = new Map();
    if (!signals || !selectedSensors.length) return map;
    const { idxs, xs } = windowSamplePlan;
    for (const sid of selectedSensors) {
      const arr = signals.byId.get(sid);
      if (!arr) { map.set(sid, [xs, []]); continue; }
      const ys = idxs.map(i => arr[i]);
      map.set(sid, [xs, ys]);
    }
    return map;
  }, [signals, selectedSensors, windowSamplePlan]);

  // ----------------------------
  // uPlot integration
  // ----------------------------
  const uplotDivRef = useRef(null);
  const uplotRef = useRef(null);
  const roRef = useRef(null);

  // Key that changes when series membership changes
  const seriesKey = useMemo(() => selectedSensors.join("|"), [selectedSensors]);

  // Build uPlot series + data arrays
  const uplotDataAndSeries = useMemo(()=>{
    if(!signals || !selectedSensors.length){ return { data:[[]], series:[{}] }; }
    const xs = timeSeriesById.get(selectedSensors[0])?.[0] || [];
    const data = [xs.slice()];
    const series = [{ label: "Time (s)", value: (u,v)=> v==null? "": v.toFixed(3)+" s" }];
    for(const sid of selectedSensors){
      const pair = timeSeriesById.get(sid) || [[],[]];
      const L = Math.min(data[0].length, pair[0].length);
      const ys = pair[1].slice(0, L);
      data.push(ys);
      series.push({ label: sid, stroke: colorForId(sid), width: 2 });
    }
    return { data, series };
  },[timeSeriesById, selectedSensors]);

  // (Re)create uPlot whenever the set of series changes
  useEffect(()=>{
    const el = uplotDivRef.current;
    // cleanup old
    if (roRef.current) { roRef.current.disconnect(); roRef.current = null; }
    if (uplotRef.current) { uplotRef.current.destroy(); uplotRef.current = null; }
    if (!el) return;

    const u = new uPlot({
      width: el.clientWidth || 600,
      height: 380,
      scales: { x: { time: false, auto: false}, y: { auto: true } },
      axes: [
        { stroke: "#bbb", grid: { show: false }, values: (u, vals) => vals.map(v=>v.toFixed(1)) },
        { stroke: "#bbb", grid: { show: false } },
      ],
      series: uplotDataAndSeries.series,
      legend: { show: false },
      cursor: { show: false },
    }, uplotDataAndSeries.data, el);

    
    uplotRef.current = u;
    setPlotWidth(el.clientWidth || 600);
    u.setScale("x", { min: windowBounds.start, max: windowBounds.end });
    u.setScale('y', { min: minVal, max: maxVal })

    // Resize handling
    const ro = new ResizeObserver(() => {
      const el2 = uplotDivRef.current; if (!el2 || !uplotRef.current) return;
      const w = el2.clientWidth;
      uplotRef.current.setSize({ width: el2.clientWidth, height: 380 });
      setPlotWidth(w);
    });
    ro.observe(el);
    roRef.current = ro;

    return () => {
      if (roRef.current) { roRef.current.disconnect(); roRef.current = null; }
      if (uplotRef.current) { uplotRef.current.destroy(); uplotRef.current = null; }
    };
  },[seriesKey]); // <— recreate when selection set changes

  // Update data & x-range as values/window change (series count same)
  useEffect(()=>{
    const u = uplotRef.current; if(!u) return;
    try {
      u.setData(uplotDataAndSeries.data);
      u.setScale("x", { min: windowBounds.start, max: windowBounds.end });
      u.setScale('y', { min: minVal, max: maxVal  })
    } catch (_) {
      // If mismatch happens anyway, next seriesKey change will rebuild.
    }
  },[uplotDataAndSeries, windowBounds.start, windowBounds.end]);

  // ----- canvas map (unchanged, rAF) -----
  const canvasRef=useRef(null); const size=670, gridMax=11;
  useEffect(()=>{ 
    let raf; 
    const canvas=canvasRef.current; 
    if(!canvas) return; 
    const ctx=canvas.getContext("2d"); 
    if(!ctx) return; 
    canvas.width=size; 
    canvas.height=size; 
    const [vmin,vmax]=valueRange; 
    function draw(){ 
      ctx.clearRect(0,0,size,size); 
      ctx.strokeStyle="#7c7c7cff"; 
      ctx.lineWidth=1; 
      for(let g=0; g<=gridMax; g++){ 
        const p=(g/gridMax)*size; 
        ctx.beginPath(); 
        ctx.moveTo(0,p); 
        ctx.lineTo(size,p); 
        ctx.stroke(); 
        ctx.beginPath(); 
        ctx.moveTo(p,0); 
        ctx.lineTo(p,size); 
        ctx.stroke(); 
      } 
      const ts=signals?.timestamps; 
      const N=ts?.length||0; 
      let i=0; 
      if(N){ 
        const t=playheadSec||0; 
        let lo=0,hi=N; 
        while(lo<hi){ 
          const mid=(lo+hi)>>1; 
          if(ts[mid]<t) lo=mid+1; 
          else hi=mid; 
        } 
        i=Math.max(0, Math.min(lo, N-1)); 
      } 
      for(const s of SENSORS){ 
        const px=((s.grid.x+1)/gridMax)*size; 
        const py=((gridMax - s.grid.y - 1)/gridMax)*size; 
        const arr=signals?.byId?.get(s.id); 
        const v=arr? arr[i]: 0; 
        ctx.beginPath(); 
        ctx.fillStyle=colorForValue(v,vmin,vmax); 
        ctx.arc(px,py,pointRadius,0,Math.PI*2); 
        ctx.fill(); ctx.fillStyle="#fff"; 
        ctx.font="12px sans-serif"; 
        ctx.textAlign="center"; 
        ctx.fillText(s.id, px, py-pointRadius-4); 
        if(selectedSensors.includes(s.id)){ 
          ctx.beginPath(); 
          ctx.lineWidth=2; 
          ctx.strokeStyle="#fff"; 
          ctx.arc(px,py,pointRadius+4,0,Math.PI*2); 
          ctx.stroke(); 
        } 
      } 
      raf=requestAnimationFrame(draw); 
    } 
    raf=requestAnimationFrame(draw); 
    return ()=> cancelAnimationFrame(raf); 
  },[signals, playheadSec, valueRange, pointRadius, selectedSensors]);

  // --- selection ---
  function toggleSelection(id){ 
    setSelectedSensors((prev)=> prev.includes(id)? prev.filter((s)=>s!==id): [...prev,id]); 
  }
  function pickSensor(evt){ 
    const canvas=canvasRef.current; 
    if(!canvas) return; 
    const rect=canvas.getBoundingClientRect(); 
    const mx=evt.clientX-rect.left, 
    my=evt.clientY-rect.top; 
    let bestId=selectedSensors[0], bestD2=Infinity; 
    for(const s of SENSORS){ 
      const px=((s.grid.x+1)/gridMax)*size; 
      const py=((gridMax - s.grid.y - 1)/gridMax)*size; 
      const dx=px-mx, dy=py-my; 
      const d2=dx*dx+dy*dy; 
      if(d2<bestD2){ 
        bestD2=d2; bestId=s.id; 
      } 
    } 
    if(bestId) toggleSelection(bestId); 
  }

  // --- CSV loader ---
  async function onPickCsv(e){
    const f = e.target.files?.[0]; if (!f) return;
    const text = await f.text();
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(',');
    const rawT = [];

    // Map headers to sensor ids (ESPx_SensorY)
    const colToSensorId = headers.map(headerToSensorId);
    const sensorCols = [];
    for (let c = 0; c < headers.length; c++) {
      const sid = colToSensorId[c];
      if (sid) sensorCols.push({ c, sid });
    }

    // Temp storage for sensor series
    const temp = new Map(sensorCols.map(({ sid }) => [sid, []]));

    // --- read specific filter metadata columns at the tail (b, a, order, type)
    const headerIndex = Object.fromEntries(headers.map((h, i) => [h.trim().toLowerCase(), i]));
    const bIdx   = headerIndex["b"];
    const aIdx   = headerIndex["a"];
    const ordIdx = headerIndex["order"];
    const typeIdx= headerIndex["type"];

    // Read rows
    let lastB, lastA, lastOrder, lastType;
    for (let r = 1; r < lines.length; r++) {
      const parts = lines[r].split(',');
      if (parts.length !== headers.length) continue;

      const tval = parseFloat(parts[0]);
      if (!Number.isNaN(tval)) rawT.push(tval);

      for (const { c, sid } of sensorCols) {
        const v = parseFloat(parts[c]);
        if (!Number.isNaN(v)) temp.get(sid).push(v);
      }

      if (bIdx   !== undefined && parts[bIdx]   !== "") lastB    = parts[bIdx];
      if (aIdx   !== undefined && parts[aIdx]   !== "") lastA    = parts[aIdx];
      if (ordIdx !== undefined && parts[ordIdx] !== "") lastOrder= parts[ordIdx];
      if (typeIdx!== undefined && parts[typeIdx]!== "") lastType = parts[typeIdx];
    }

    // Build data arrays
    const byIdRaw = new Map();
    for (const [sid, arr] of temp.entries()) {
      byIdRaw.set(sid, Float32Array.from(arr));
    }

    // ---- timestamps (seconds) with unit auto-detection
    function median(a) {
      if (!a.length) return 0;
      const b = a.slice().sort((x,y)=>x-y);
      const m = b.length >> 1;
      return b.length % 2 ? b[m] : 0.5*(b[m-1]+b[m]);
    }

    let timestamps;
    if (rawT.length >= 2) {
      const t0 = rawT[0];
      const deltas = [];
      for (let i = 1; i < Math.min(rawT.length, 201); i++) {
        const d = rawT[i] - rawT[i-1];
        if (Number.isFinite(d) && d > 0) deltas.push(d);
      }
      const dMed = median(deltas);
      const scale = dMed >= 1000 ? 1e6 : dMed >= 1 ? 1e3 : 1; // μs / ms / s
      timestamps = Float64Array.from(rawT, v => (v - t0) / scale);
    } else {
      const first = byIdRaw.values().next().value;
      const N = first?.length ?? 0;
      const fsGuess = 200;
      timestamps = Float64Array.from({ length: N }, (_, i) => i / fsGuess);
    }

    // Derive duration & effective sample rate from timestamps
    const N = timestamps.length;
    const durationSec = N ? timestamps[N-1] : 0;
    const fs = (N > 1 && durationSec > 0) ? (N - 1) / durationSec : 200;

    // Parse coeff helpers (accept JSON like "[ ... ]" or delimited like "c1;c2;c3")
    const parseCoeffs = (s) => {
      if (s == null) return null;
      const t = String(s).trim();
      if (!t) return null;
      try {
        const val = JSON.parse(t);
        if (Array.isArray(val)) return val.map(Number).filter(Number.isFinite);
      } catch {}
      return t
        .replace(/^\[|\]$/g, '')
        .split(/\s*;\s*|\s+/)
        .map(Number)
        .filter(Number.isFinite);
    };

    const bCoeffs = parseCoeffs(lastB);
    const aCoeffs = parseCoeffs(lastA);
    const ordNum  = lastOrder !== undefined ? parseInt(String(lastOrder).trim(), 10) : undefined;
    const typeStr = lastType ? String(lastType).trim() : undefined;

    // Compose the note. If type/order match Butterworth order 2, say so explicitly.
    const isButter = (typeStr || "").toLowerCase().includes("butter");
    const isOrder2 = ordNum === 2;
    if (isButter && isOrder2) {
      const parts = [];
      if (bCoeffs) parts.push(`max order b=[${bCoeffs.join(', ')}]`);
      if (aCoeffs) parts.push(`a=[${aCoeffs.join(', ')}]`);
      const tail = parts.join(' • ');
      setFilterNote(`Pre-filtered: 2nd-order Butterworth${tail ? ": " + tail : ""}`);
    } else if (bCoeffs || aCoeffs || Number.isFinite(ordNum) || typeStr) {
      const headBits = [];
      if (typeStr) headBits.push(typeStr);
      if (Number.isFinite(ordNum)) headBits.push(`order ${ordNum}`);
      const bTxt = bCoeffs ? `b=[${bCoeffs.join(', ')}]` : null;
      const aTxt = aCoeffs ? `a=[${aCoeffs.join(', ')}]` : null;
      const tail = [bTxt, aTxt].filter(Boolean).join(" • ");
      setFilterNote(`Pre-filtered (${headBits.join(" ") || "filter"})${tail ? ": " + tail : ""}`);
    } else {
      setFilterNote("Pre-filtered (expected metadata columns b, a, order, type not found). Showing raw signals as-is.");
    }

    setRawSignals({ byId: byIdRaw, sampleRate: fs, durationSec, timestamps });
    setPlayheadSec(0);
    setIsPlaying(true);
  }

  // ----- Render -----
  const [minVal,maxVal]=valueRange;
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, padding:16, overflow:"hidden" }}>
      <div>
        <canvas ref={canvasRef} width={670} height={670} onClick={pickSensor} style={{ width:670, height:670, background:"#111", borderRadius:12 }} />
      </div>

      <div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
          {selectedSensors.map((id)=> (
            <span key={id} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'2px 8px', borderRadius:12, border:`1px solid ${colorForId(id)}`, background:`${colorForId(id)} / 0.12`, color:colorForId(id), fontSize:12, fontWeight:600 }}>
              <span style={{ width:10, height:10, borderRadius:9999, background:colorForId(id) }} />
              {id}
            </span>
          ))}
        </div>

        <div style={{ position:'relative', width:'100%', height:380, background:'#181818', borderRadius:12, overflow:'hidden' }}>
          <div ref={uplotDivRef} style={{ position:'absolute', inset:0 }} />
          {(()=>{ const {start,end}=windowBounds; const pos = end>start? ((playheadSec-start)/(end-start)): 0; const clamped=Math.max(0, Math.min(1, pos)); return (
            <div style={{ position:'absolute', inset:0, pointerEvents:'none', left:'50px', width:'648px' }}>
              <div style={{ position:'absolute', top:0, bottom:0, left:`calc(${(clamped*100).toFixed(4)}% - 1px)`, width:2, background:'#888', opacity:0.9 }} />
            </div>
          ); })()}
        </div>

        {/* Note: replaced the old uPlot canvas-based blurb with filter metadata */}
        <div style={{ fontSize:12, opacity:0.8, marginTop:8 }}>{filterNote}</div>

        <div style={{ display:'flex', gap:16, alignItems:'center', marginTop:12, flexWrap:'wrap' }}>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:12 }}>Min</span>
            <input type="number" step="1" value={minVal} onChange={(e)=> setValueRange([parseFloat(e.target.value), maxVal])} style={{ width:80 }} />
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:12 }}>Max</span>
            <input type="number" step="1" value={maxVal} onChange={(e)=> setValueRange([minVal, parseFloat(e.target.value)])} style={{ width:80 }} />
          </label>
        </div>

        {/* Removed Low/High cut controls and fs/Nyquist line since we no longer filter */}

        <div style={{ display:'flex', gap:12, alignItems:'center', marginTop:12, flexWrap:'wrap' }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, minWidth:220 }}>
            <span style={{ fontSize:12 }}>Time window (s)</span>
            <input type="range" min="1" max={Math.max(1, signals?.durationSec??10)} step="1" value={timeWindowSec} onChange={(e)=> setTimeWindowSec(parseFloat(e.target.value))} style={{ flex:1 }} />
            <input type="number" min="1" max={Math.max(1, signals?.durationSec??10)} step="1" value={timeWindowSec} onChange={(e)=> setTimeWindowSec(Math.max(0.2, parseFloat(e.target.value)||0.2))} style={{ width:80 }} />
          </label>
        </div>

        <div style={{ display:'flex', gap:12, alignItems:'center', margin:8 }}>
          <input type="file" accept=".csv" onChange={onPickCsv} />
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12, margin:'8px 0' }}>
          <button onClick={()=> setIsPlaying((p)=> !p)} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #444', background:'#222', color:'#eee' }}>
            {isPlaying? "⏸ Pause": "▶ Play"}
          </button>
          <input type="range" min={0} max={Math.max(0, (signals?.durationSec??0))} step={0.01} value={Math.min(playheadSec, Math.max(0, (signals?.durationSec??0)))} onChange={(e)=> { setIsPlaying(false); setPlayheadSec(parseFloat(e.target.value)||0); }} style={{ flex:1 }} />
          <div style={{ width:260, textAlign:'right', color:'#ccc', fontVariantNumeric:'tabular-nums' }}>
            t = {playheadSec.toFixed(3)} s • window [{windowBounds.start.toFixed(2)}–{windowBounds.end.toFixed(2)}] s
          </div>
        </div>
      </div>
    </div>
  );
}
