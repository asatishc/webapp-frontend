
import React, { useEffect, useState } from 'react';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { admin } from '../../api';

export default function StepProgress({ runId, onComplete, onBack }:{ runId:string; onComplete:(info:any)=>void; onBack:()=>void }){
  const [info, setInfo] = useState<any>(null);

  useEffect(()=>{
    if(!runId) return;
    const t = setInterval(async ()=>{
      const r = await admin.getRun(runId); setInfo(r);
      if(r?.run?.status==='COMPLETED' || r?.run?.status==='FAILED'){ clearInterval(t); onComplete(r); }
    }, 500);
    return ()=>clearInterval(t);
  },[runId]);

  const steps = info?.steps || [];
  const running = steps.filter((x:any)=>x.status==='IN_PROGRESS');
  const completed = steps.filter((x:any)=>x.status==='DONE');
  const remaining = steps.filter((x:any)=>x.status==='PENDING');

  return (
    <Box>
      <Typography variant="h6">Workflow Progress</Typography>
      <Stack direction='row' spacing={1} sx={{mb:1, mt:1}}>
        <Chip label={`Completed: ${completed.length}`} color='success'/>
        <Chip label={`Running: ${running.length}`} color='warning'/>
        <Chip label={`Remaining: ${remaining.length}`}/>
      </Stack>

      <Paper variant='outlined' sx={{p:1, mb:1}}>
        <Typography fontWeight={600}>Currently Running Steps</Typography>
        {running.length===0 ? <Typography variant='body2'>None</Typography> : (
          <ul style={{marginTop:6}}>{running.map((s:any)=>(<li key={s.id}><b>{s.step_name}</b> — {s.status}</li>))}</ul>
        )}
      </Paper>

      <Paper variant='outlined' sx={{p:1, mb:1}}>
        <Typography fontWeight={600}>Completed</Typography>
        {completed.length===0 ? <Typography variant='body2'>None</Typography> : (
          <ul style={{marginTop:6}}>{completed.map((s:any)=>(<li key={s.id}><b>{s.step_name}</b> — finished {s.finished_at}</li>))}</ul>
        )}
      </Paper>

      <Paper variant='outlined' sx={{p:1}}>
        <Typography fontWeight={600}>Pending</Typography>
        {remaining.length===0 ? <Typography variant='body2'>None</Typography> : (
          <ul style={{marginTop:6}}>{remaining.map((s:any)=>(<li key={s.id}><b>{s.step_name}</b> — {s.status}</li>))}</ul>
        )}
      </Paper>

      <Box mt={2}><Button onClick={onBack}>Back</Button></Box>
    </Box>
  );
}
