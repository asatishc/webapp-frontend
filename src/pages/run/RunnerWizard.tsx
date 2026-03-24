
import React, { useState } from 'react';
import { Box, Stepper, Step, StepLabel } from '@mui/material';
import StepSelectTrigger from './StepSelectTrigger';
import StepProgress from './StepProgress';
import StepResults from './StepResults';

const steps = ['Select & Trigger','Progress','Results'];
export default function RunnerWizard(){
  const [active, setActive] = useState(0);
  const [runId, setRunId] = useState('');
  const [runInfo, setRunInfo] = useState<any>(null);

  return (
    <Box>
      <Stepper activeStep={active} alternativeLabel>
        {steps.map(s=> <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
      </Stepper>
      <Box mt={2}>
        {active===0 && <StepSelectTrigger onTriggered={(rid)=>{ setRunId(rid); setActive(1); }} />}
        {active===1 && <StepProgress runId={runId} onComplete={(info)=>{ setRunInfo(info); setActive(2); }} onBack={()=>setActive(0)} />}
        {active===2 && <StepResults runInfo={runInfo} onRestart={()=>{ setActive(0); setRunId(''); setRunInfo(null); }} />}
      </Box>
    </Box>
  );
}
