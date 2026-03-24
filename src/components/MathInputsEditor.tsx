
import React from 'react';
import { Box, Button, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
export type MathInput = { const?: number|string; path?: string };
export default function MathInputsEditor({ value, onChange }:{ value: MathInput[]; onChange:(v: MathInput[])=>void }){
  function add(kind:'const'|'path'){ onChange([...(value||[]), kind==='const'? {const:0}:{path:'$.trigger.a'}]); }
  function remove(i:number){ const next=[...value]; next.splice(i,1); onChange(next); }
  function switchKind(i:number, kind:'const'|'path'){ const next=[...value]; next[i]=kind==='const'? {const:0}:{path:'$.trigger.a'}; onChange(next); }
  function update(i:number, patch: MathInput){ const next=[...value]; next[i]=patch; onChange(next); }
  return (
    <Box>
      <Typography fontWeight={600}>Inputs</Typography>
      <Stack direction="row" spacing={1} sx={{mt:1}}>
        <Button size="small" onClick={()=>add('const')}>+ Const</Button>
        <Button size="small" onClick={()=>add('path')}>+ Path</Button>
      </Stack>
      {(value||[]).map((inp, i)=> (
        <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{mt:1}}>
          <Select size="small" value={'const' in inp? 'const':'path'} onChange={e=>switchKind(i, String(e.target.value) as any)}>
            <MenuItem value="const">const</MenuItem>
            <MenuItem value="path">path</MenuItem>
          </Select>
          {'const' in inp ? (
            <TextField size="small" label="Value (number or text)" value={(inp as any).const ?? ''} onChange={e=>update(i,{const:e.target.value})} sx={{minWidth:200}}/>
          ) : (
            <TextField size="small" label="Path (e.g. $.trigger.a)" value={inp.path ?? '$.trigger.a'} onChange={e=>update(i,{path:e.target.value})} sx={{minWidth:360}}/>
          )}
          <Button size="small" onClick={()=>remove(i)}>Remove</Button>
        </Stack>
      ))}
    </Box>
  );
}
