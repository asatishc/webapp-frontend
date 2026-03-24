
import React, { useEffect, useState } from 'react';
import { Box, Button, MenuItem, Select, TextField, Typography } from '@mui/material';
import { admin, isUuid } from '../../api';

export default function StepSelectTrigger({ onTriggered }:{ onTriggered:(runId:string)=>void }){
  const [wfId, setWfId] = useState('');
  const [list, setList] = useState<any[]>([]);
  const [triggerJson, setTriggerJson] = useState('{"a":7,"b":5,"c":3,"d":4}');

  useEffect(()=>{ admin.listWorkflows().then(setList).catch(()=>{}); },[]);

  async function go(){
    if (!isUuid(wfId)) { alert('Select a workflow'); return; }
    const payload = JSON.parse(triggerJson||'{}');
    const r = await admin.trigger(wfId, payload);
    const id = r?.id || r?.runId; if (!isUuid(id)) { alert('Trigger failed: invalid run id. Ensure Start step exists.'); return; }
    onTriggered(id);
  }

  return (
    <Box>
      <Typography variant="h6">Select Workflow & Trigger</Typography>
      <Box mt={2}><Select value={wfId} onChange={(e)=>setWfId(String(e.target.value))} sx={{minWidth:360}} displayEmpty>
        <MenuItem value=""><em>Select workflow</em></MenuItem>
        {list.map(w=>(<MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>))}
      </Select></Box>
      <Box mt={2}><TextField multiline minRows={5} label="Trigger JSON" sx={{minWidth:500}} value={triggerJson} onChange={e=>setTriggerJson(e.target.value)} /></Box>
      <Box mt={2} display="flex" gap={2}><Button disabled={!isUuid(wfId)} variant="contained" onClick={go}>Trigger</Button></Box>
    </Box>
  );
}
