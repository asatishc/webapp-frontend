
import React from 'react';
import { Box, Button, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';

type Row = { key: string; mode: 'const'|'path'; value: string };
export default function KeyValueEditor({ title, rows, onChange, valuePlaceholder='value' }:{ title:string; rows:Row[]; onChange:(rows:Row[])=>void; valuePlaceholder?:string }){
  function add(){ onChange([...(rows||[]), { key:'', mode:'const', value:'' }]); }
  function update(i:number, patch:Partial<Row>){ const next=[...rows]; next[i] = { ...next[i], ...patch } as Row; onChange(next); }
  function remove(i:number){ const next=[...rows]; next.splice(i,1); onChange(next); }
  return (
    <Box sx={{mt:2}}>
      <Typography fontWeight={600}>{title}</Typography>
      <Button size="small" sx={{mt:1}} onClick={add}>+ Add</Button>
      {(rows||[]).map((r,i)=>(
        <Stack key={i} direction="row" spacing={1} sx={{mt:1}} alignItems="center">
          <TextField size="small" label="key" value={r.key} onChange={e=>update(i,{key:e.target.value})}/>
          <Select size="small" value={r.mode} onChange={e=>update(i,{mode: e.target.value as any})}>
            <MenuItem value="const">const</MenuItem>
            <MenuItem value="path">path</MenuItem>
          </Select>
          <TextField size="small" label={valuePlaceholder} value={r.value} onChange={e=>update(i,{value:e.target.value})} sx={{minWidth:300}}/>
          <Button size="small" onClick={()=>remove(i)}>Remove</Button>
        </Stack>
      ))}
    </Box>
  );
}

export function rowsToHeaders(rows: Row[]): Record<string,string> { const out:Record<string,string>={}; (rows||[]).forEach(r=>{ if(r.key) out[r.key]=r.value; }); return out; }
export function headersToRows(h: Record<string,string>|undefined): Row[] { return Object.entries(h||{}).map(([k,v])=>({ key:k, mode:'const', value:String(v)})); }
export function rowsToRequestMap(rows: Row[]): Record<string,string|number> { const out:Record<string,string|number>={}; (rows||[]).forEach(r=>{ if(!r.key) return; if(r.mode==='path') out[r.key]=r.value; else out[r.key]= isNaN(Number(r.value))? r.value : Number(r.value); }); return out; }
export function requestMapToRows(m: Record<string,any>|undefined): Row[] { return Object.entries(m||{}).map(([k,v])=> (typeof v==='string' && v.startsWith('$.'))? {key:k, mode:'path', value:v}:{key:k, mode:'const', value:String(v)} ); }
