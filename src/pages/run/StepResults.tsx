
import React from 'react';
import { Box, Button, Typography } from '@mui/material';

export default function StepResults({ runInfo, onRestart }:{ runInfo:any; onRestart:()=>void }){
  const steps = runInfo?.steps || [];
  const lastDone = [...steps].reverse().find((s:any)=>s.status==='DONE');
  // Show only math value if response has {value}
  const value = (lastDone?.response_payload && typeof lastDone.response_payload==='object' && 'value' in lastDone.response_payload)
    ? (lastDone.response_payload.value ?? '')
    : '';
  return (
    <Box>
      <Typography variant="h6">Results</Typography>
      <Typography>Run Status: {runInfo?.run?.status}</Typography>
      <Typography sx={{mt:1}}>Final Step: {lastDone?.step_name}</Typography>
      <Typography sx={{mt:1}} variant="h5">Value: {String(value)}</Typography>
      <Box mt={2}><pre style={{background:'#f5f5f5',padding:8}}>{JSON.stringify(runInfo,null,2)}</pre></Box>
      <Box mt={2}><Button variant="contained" onClick={onRestart}>Run Another</Button></Box>
    </Box>
  );
}
