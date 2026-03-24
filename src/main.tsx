
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { admin, isUuid } from './api';
import { Box, Button, Chip, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import MathInputsEditor, { MathInput } from './components/MathInputsEditor';
import KeyValueEditor, { headersToRows, requestMapToRows, rowsToHeaders, rowsToRequestMap } from './components/KeyValueEditor';
import RunnerWizard from './pages/run/RunnerWizard';

function Builder(){
  const [wfId, setWfId] = useState('');
  const [list, setList] = useState<any[]>([]);
  const [draft, setDraft] = useState<any>({ name:'Math Pipeline', steps:[] });
  const [loadedDef, setLoadedDef] = useState<any>(null);
  useEffect(()=>{ admin.listWorkflows().then(setList); },[]);

  function addStep(){
    const idx = draft.steps.length+1;
    setDraft({...draft, steps:[...draft.steps, {
      step_name:`Step${idx}`, step_type:'MATH', is_start: idx===1, is_end:false, __uiCollapsed:false,
      config:{ math:{ op:'ADD', inputs:[{path:'$.trigger.a'},{path:'$.trigger.b'}] as MathInput[], precision:2 }, onError:{divideByZero:'FAIL'}, retries:{ maxAttempts:4, initialDelaySec:2, maxBackoffSec:60, jitterMs:250 } }
    }]});
  }
  function updateStep(i:number, patch:any){ const arr=[...draft.steps]; arr[i]={...arr[i], ...patch}; setDraft({...draft, steps:arr}); }
  function removeStep(i:number){ const arr=[...draft.steps]; arr.splice(i,1); setDraft({...draft, steps:arr}); }
  function hideAll(){ setDraft({...draft, steps: draft.steps.map((s:any)=>({...s, __uiCollapsed:true}))}); }
  function showAll(){ setDraft({...draft, steps: draft.steps.map((s:any)=>({...s, __uiCollapsed:false}))}); }
  function patchConfig(i:number, patch:any){ const s=draft.steps[i]; updateStep(i, { config:{ ...(s.config||{}), ...patch } }); }

  async function createNew(){
    const wf = await admin.createWorkflow({ name: draft.name });
    const created:any[] = [];
    for (const s of draft.steps){ const r = await admin.addStep(wf.id, stripUi(s)); created.push(r); }
    for (let i=0;i<created.length-1;i++){ await admin.addTransition(wf.id, { from_step: created[i].id, to_step: created[i+1].id, condition:{always:true} }); }
    alert('Workflow saved: '+wf.id); setDraft({ name:'Math Pipeline', steps:[] }); setLoadedDef(null); admin.listWorkflows().then(setList);
  }
  async function loadForEdit(){ if(!isUuid(wfId)) return; const def=await admin.getDefinition(wfId); if(!def) return; const steps=(def.steps||[]).map((s:any)=>({...s,__uiCollapsed:false})); setLoadedDef(def); setDraft({ name:def.workflow.name, steps }); }
  async function saveEditsReplace(){ if(!loadedDef) return; await admin.updateWorkflow(loadedDef.workflow.id, { name:draft.name, description: loadedDef.workflow.description }); await admin.resetWorkflow(loadedDef.workflow.id); const created:any[]=[]; for(const s of draft.steps){ const r=await admin.addStep(loadedDef.workflow.id, stripUi(s)); created.push(r); } for(let i=0;i<created.length-1;i++){ await admin.addTransition(loadedDef.workflow.id, { from_step: created[i].id, to_step: created[i+1].id, condition:{always:true} }); } alert('Workflow replaced: '+loadedDef.workflow.id); }

  return (
    <Box>
      <Typography variant='h6'>Design / Edit</Typography>
      <Box mt={1}><TextField label='Workflow Name' value={draft.name} onChange={e=>setDraft({...draft, name:e.target.value})}/></Box>
      <Stack direction='row' spacing={1} sx={{mt:1}}>
        <Button variant='outlined' onClick={addStep}>+ Add Step</Button>
        <Button onClick={hideAll}>Hide All</Button>
        <Button onClick={showAll}>Show All</Button>
      </Stack>

      <Box sx={{mt:1}}>
        {draft.steps.map((s:any,i:number)=>(
          <Paper key={i} sx={{p:1, mt:1}} variant='outlined'>
            {s.__uiCollapsed ? (
              <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Typography fontWeight={600}>{s.step_name} · {s.step_type}</Typography>
                <Box><Button size='small' onClick={()=>updateStep(i,{__uiCollapsed:false})}>Show</Button><Button size='small' color='error' onClick={()=>removeStep(i)}>Remove</Button></Box>
              </Stack>
            ) : (
              <>
                <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{mb:1}}>
                  <Stack direction='row' spacing={1} alignItems='center'>
                    <TextField label='Step Name' value={s.step_name} onChange={e=>updateStep(i,{step_name:e.target.value})}/>
                    <Select value={s.step_type} onChange={e=>updateStep(i,{step_type:e.target.value})}>
                      <MenuItem value='MATH'>MATH</MenuItem>
                      <MenuItem value='API_CALL'>API_CALL</MenuItem>
                    </Select>
                    <Chip label={'Start: '+(!!s.is_start)} onClick={()=>updateStep(i,{is_start:!s.is_start})}/>
                    <Chip label={'End: '+(!!s.is_end)} onClick={()=>updateStep(i,{is_end:!s.is_end})}/>
                  </Stack>
                  <Box><Button size='small' onClick={()=>updateStep(i,{__uiCollapsed:true})}>Hide</Button><Button size='small' color='error' onClick={()=>removeStep(i)}>Remove</Button></Box>
                </Stack>

                {s.step_type==='MATH' && (
                  <>
                    <Stack direction='row' spacing={1} alignItems='center' sx={{mb:1}}>
                      <Typography>Operation</Typography>
                      <Select value={s.config?.math?.op||'ADD'} onChange={e=>patchConfig(i,{ math:{ ...(s.config?.math||{}), op:e.target.value } })}>
                        {['ADD','SUB','MUL','DIV','MOD','POW','MIN','MAX','AVG','ABS'].map(o=> <MenuItem key={o} value={o}>{o}</MenuItem>)}
                      </Select>
                      <TextField type='number' label='Precision' value={s.config?.math?.precision ?? 2} onChange={e=>patchConfig(i,{ math:{ ...(s.config?.math||{}), precision:Number(e.target.value) } })}/>
                      {(s.config?.math?.op==='DIV' || s.config?.math?.op==='MOD') && (
                        <Select value={s.config?.onError?.divideByZero || 'FAIL'} onChange={e=>patchConfig(i,{ onError:{ ...(s.config?.onError||{}), divideByZero: String(e.target.value) } })}>
                          <MenuItem value='FAIL'>FAIL</MenuItem>
                          <MenuItem value='RETURN_ZERO'>RETURN_ZERO</MenuItem>
                          <MenuItem value='RETURN_NULL'>RETURN_NULL</MenuItem>
                        </Select>
                      )}
                    </Stack>

                    <MathInputsEditor value={s.config?.math?.inputs || []} onChange={(inputs)=>patchConfig(i,{ math:{ ...(s.config?.math||{}), inputs } })}/>

                    <Box sx={{mt:2}}>
                      <Typography fontWeight={600}>Retries</Typography>
                      <Stack direction='row' spacing={1} flexWrap='wrap' sx={{mt:1}}>
                        <TextField type='number' label='maxAttempts' value={s.config?.retries?.maxAttempts ?? 4} onChange={e=>patchConfig(i,{ retries:{ ...(s.config?.retries||{}), maxAttempts:Number(e.target.value) } })}/>
                        <TextField type='number' label='initialDelaySec' value={s.config?.retries?.initialDelaySec ?? 2} onChange={e=>patchConfig(i,{ retries:{ ...(s.config?.retries||{}), initialDelaySec:Number(e.target.value) } })}/>
                        <TextField type='number' label='maxBackoffSec' value={s.config?.retries?.maxBackoffSec ?? 60} onChange={e=>patchConfig(i,{ retries:{ ...(s.config?.retries||{}), maxBackoffSec:Number(e.target.value) } })}/>
                        <TextField type='number' label='jitterMs' value={s.config?.retries?.jitterMs ?? 250} onChange={e=>patchConfig(i,{ retries:{ ...(s.config?.retries||{}), jitterMs:Number(e.target.value) } })}/>
                      </Stack>
                    </Box>
                  </>
                )}

                {s.step_type==='API_CALL' && (
                  <>
                    <Stack direction='row' spacing={1} sx={{mb:1}}>
                      <TextField label='Endpoint' value={s.service_endpoint||''} onChange={e=>updateStep(i,{service_endpoint:e.target.value})} sx={{minWidth:420}}/>
                      <Select value={s.method||'POST'} onChange={e=>updateStep(i,{method:e.target.value})}>
                        {['GET','POST','PUT','PATCH','DELETE'].map(m=> <MenuItem key={m} value={m}>{m}</MenuItem>)}
                      </Select>
                    </Stack>
                    <KeyValueEditor title='Headers' rows={headersToRows(s.config?.headers)} onChange={(rows)=>patchConfig(i,{ headers: rowsToHeaders(rows) })} valuePlaceholder='header value'/>
                    <KeyValueEditor title='Request Map' rows={requestMapToRows(s.config?.requestMap)} onChange={(rows)=>patchConfig(i,{ requestMap: rowsToRequestMap(rows) })} valuePlaceholder='const value or $.path'/>
                  </>
                )}
              </>
            )}
          </Paper>
        ))}
      </Box>

      <Stack direction='row' spacing={1} sx={{mt:2}}>
        <Button variant='contained' onClick={createNew}>Save as New</Button>
        <Select size='small' value={wfId} onChange={e=>setWfId(String(e.target.value))} displayEmpty>
          <MenuItem value=''><em>Load workflow...</em></MenuItem>
          {list.map(w=> <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
        </Select>
        <Button onClick={loadForEdit} disabled={!isUuid(wfId)}>Load for Edit</Button>
        <Button color='warning' onClick={saveEditsReplace} disabled={!loadedDef}>Save Edits (Replace)</Button>
      </Stack>
    </Box>
  );
}

function Runner(){
  const [wfId, setWfId] = useState('');
  const [wfList, setWfList] = useState<any[]>([]);
  const [runId, setRunId] = useState('');
  const [info, setInfo] = useState<any>(null);
  useEffect(()=>{ admin.listWorkflows().then(setWfList); },[]);

  async function trigger(){
    try{
      const r = await admin.trigger(wfId, {a:7,b:5,c:3,d:4});
      const id = r?.id || r?.runId;
      if(!isUuid(id)){
        console.error('Trigger did not return valid run id', r);
        alert('Trigger failed: no valid run id returned. Ensure a Start step exists.');
        return;
      }
      setRunId(id);
      const t = setInterval(async ()=>{
        if(!isUuid(id)){ clearInterval(t); return; }
        try{
          const x = await admin.getRun(id);
          setInfo(x);
          if (x?.run?.status==='COMPLETED' || x?.run?.status==='FAILED') clearInterval(t);
        }catch(e){ console.error('Polling error', e); clearInterval(t); }
      }, 500);
    }catch(e:any){
      console.error('Trigger error', e);
      alert(e?.message?.includes('start step')? 'This workflow has no Start step. Mark Start and try again.' : 'Trigger failed. Check console.');
    }
  }

  const steps = info?.steps || [];
  const running = steps.filter((s:any)=>s.status==='IN_PROGRESS');
  const done    = steps.filter((s:any)=>s.status==='DONE');
  const pending = steps.filter((s:any)=>s.status==='PENDING');

  return (
    <Box>
      <Typography variant='h6'>Run & Monitor</Typography>
      <Stack direction='row' spacing={1} sx={{mb:1}}>
        <Select size='small' value={wfId} onChange={e=>setWfId(String(e.target.value))} displayEmpty>
          <MenuItem value=''><em>Select workflow</em></MenuItem>
          {wfList.map(w=> <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
        </Select>
        <Button disabled={!isUuid(wfId)} variant='contained' onClick={trigger}>Trigger</Button>
      </Stack>
      {isUuid(runId) && (
        <>
          <Stack direction='row' spacing={1} sx={{mb:1}}>
            <Chip label={`Completed: ${done.length}`} color='success'/>
            <Chip label={`Running: ${running.length}`} color='warning'/>
            <Chip label={`Remaining: ${pending.length}`}/>
          </Stack>

          <Paper variant='outlined' sx={{p:1, mb:1}}>
            <Typography fontWeight={600}>Currently Running Steps</Typography>
            {running.length===0 ? <Typography variant='body2'>None</Typography> : (
              <ul style={{marginTop:6}}>{running.map((s:any)=>(<li key={s.id}><b>{s.step_name}</b> — {s.status}</li>))}</ul>
            )}
          </Paper>

          <Paper variant='outlined' sx={{p:1, mb:1}}>
            <Typography fontWeight={600}>Completed</Typography>
            {done.length===0 ? <Typography variant='body2'>None</Typography> : (
              <ul style={{marginTop:6}}>{done.map((s:any)=>(<li key={s.id}><b>{s.step_name}</b> — finished {s.finished_at}</li>))}</ul>
            )}
          </Paper>

          <Paper variant='outlined' sx={{p:1}}>
            <Typography fontWeight={600}>Pending</Typography>
            {pending.length===0 ? <Typography variant='body2'>None</Typography> : (
              <ul style={{marginTop:6}}>{pending.map((s:any)=>(<li key={s.id}><b>{s.step_name}</b> — {s.status}</li>))}</ul>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}

function Results(){
  const [wfId, setWfId] = useState('');
  const [wfList, setWfList] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [runId, setRunId] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  useEffect(()=>{ admin.listWorkflows().then(setWfList); },[]);
  useEffect(()=>{ if(!isUuid(wfId)){ setRuns([]); setRunId(''); admin.listRunSummary(undefined).then(setRows); return; } admin.listRunsForWorkflow(wfId).then(setRuns); admin.listRunSummary(wfId).then(setRows); },[wfId]);
  useEffect(()=>{ if(!isUuid(runId)) return; admin.getRun(runId).then(d=>{ const steps=(d?.steps||[]).map((s:any)=>({ runId:d.run.id, stepName:s.step_name, status:s.status, startedAt:s.started_at, finishedAt:s.finished_at, result: s.step_type==='MATH' ? (s.response_payload?.value ?? '') : '' })); setRows(steps); }); },[runId]);

  return (
    <Box>
      <Typography variant='h6'>Results</Typography>
      <Stack direction='row' spacing={1} sx={{mb:1}}>
        <Select size='small' value={wfId} onChange={e=>setWfId(String(e.target.value))} displayEmpty>
          <MenuItem value=''><em>All Workflows</em></MenuItem>
          {wfList.map(w=> <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
        </Select>
        <Select size='small' value={runId} onChange={e=>setRunId(String(e.target.value))} displayEmpty disabled={!isUuid(wfId)}>
          <MenuItem value=''><em>All Runs (for selected workflow)</em></MenuItem>
          {runs.map((r:any)=> <MenuItem key={r.id} value={r.id}>{r.id} · {new Date(r.created_at).toLocaleString()} · {r.status}</MenuItem>)}
        </Select>
      </Stack>
      <Paper variant='outlined' sx={{p:1}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr><th align='left'>Run ID</th><th align='left'>Step</th><th align='left'>Status</th><th align='left'>Start</th><th align='left'>End</th><th align='left'>Result</th></tr>
          </thead>
          <tbody>
            {rows.map((r:any,i:number)=> (
              <tr key={i}>
                <td>{r.runId}</td>
                <td>{r.stepName}</td>
                <td>{r.status}</td>
                <td>{r.startedAt ? new Date(r.startedAt).toLocaleString() : ''}</td>
                <td>{r.finishedAt ? new Date(r.finishedAt).toLocaleString() : ''}</td>
                <td>{typeof r.result==='object' ? JSON.stringify(r.result) : String(r.result)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Paper>
    </Box>
  );
}

function App(){
  const [tab, setTab] = useState<'build'|'run'|'results'|'wizard'>('build');
  return (
    <Box p={2}>
      <Stack direction='row' spacing={1} sx={{mb:1}}>
        <Button variant={tab==='build'?'contained':'outlined'} onClick={()=>setTab('build')}>Design/Edit</Button>
        <Button variant={tab==='run'?'contained':'outlined'} onClick={()=>setTab('run')}>Run & Monitor</Button>
        <Button variant={tab==='results'?'contained':'outlined'} onClick={()=>setTab('results')}>Results</Button>
        <Button variant={tab==='wizard'?'contained':'outlined'} onClick={()=>setTab('wizard')}>Run (Stepper)</Button>
      </Stack>
      <Paper sx={{p:2}}>
        {tab==='build' && <Builder/>}
        {tab==='run' && <Runner/>}
        {tab==='results' && <Results/>}
        {tab==='wizard' && <RunnerWizard/>}
      </Paper>
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App/>);

function stripUi(step:any){ const {__uiCollapsed, ...rest} = step; return rest; }
