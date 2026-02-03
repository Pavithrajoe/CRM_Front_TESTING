import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Paper,
  IconButton,
  Box,
} from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import EventIcon from "@mui/icons-material/Event";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";

/* ---------------- CONFIG ---------------- */

const ROWS = [
  ["(", ")", "%", "AC"],
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "−"],
  ["0", ".", "=", "+"],
];

const mapToInput = (l) =>
  l === "÷" ? "/" : l === "×" ? "*" : l === "−" ? "-" : l;

/* ---------------- STYLES ---------------- */

const baseBtn = {
  height: 65,
  borderRadius: 16,
  fontWeight: 600,
  fontSize: 18,
  textTransform: "none",
};

const getBtnStyle = (l) => {
  if (l === "AC") return { ...baseBtn, bgcolor: "#ef5350", color: "#fff" };
  if (l === "=") return { ...baseBtn, bgcolor: "#1976d2", color: "#fff" };
  if (["+", "−", "×", "÷"].includes(l))
    return { ...baseBtn, bgcolor: "#f1f5f9" };
  return { ...baseBtn, bgcolor: "#fafafa" };
};

/* ---------------- SAFE CALC ---------------- */

const normalizeExpression = (exp) => {
  if (!exp) return "";

  return exp
    // 2(100) → 2*(100)
    .replace(/(\d)\s*\(/g, "$1*(")

    // )( → )*(
    .replace(/\)\s*\(/g, ")*(")

    // )2 → )*2
    .replace(/\)\s*(\d)/g, ")*$1");
};

const normalizePercentage = (exp) => {
  return exp
    .replace(/(\d+(?:\.\d+)?)\s*×\s*(\d+(?:\.\d+)?)%/g, "$1*($2/100)")
    .replace(/(\d+(?:\.\d+)?)\s*÷\s*(\d+(?:\.\d+)?)%/g, "$1/($2/100)")
    .replace(/(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)%/g, "$1+($1*$2/100)")
    .replace(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)%/g, "$1-($1*$2/100)");
};



const safeEval = (expression) => {
  if (!expression) return "0";

  let exp = expression;

  //  implicit multiplication
  exp = exp
    .replace(/(\d)\(/g, "$1*(")
    .replace(/\)\(/g, ")*(")
    .replace(/\)(\d)/g, ")*$1");

  //  Google-style percentage
  exp = exp
    // A * B%
    .replace(/(\d+(?:\.\d+)?)\s*\*\s*(\d+(?:\.\d+)?)%/g, "$1*($2/100)")
    // A / B%
    .replace(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)%/g, "$1/($2/100)")
    // A + B%
    .replace(/(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)%/g, "$1+($1*$2/100)")
    // A - B%
    .replace(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)%/g, "$1-($1*$2/100)")
    // standalone 20%
    .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");

  //  final clean
  exp = exp.replace(/[^0-9+\-*/().]/g, "");

  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${exp})`)();
};

/* ---------------- MODES ---------------- */

const BasicMode = ({ expr, setExpr, onPress }) => (
  <Box>
    <TextField
      fullWidth
      value={expr || "0"}
      inputProps={{
        style: { textAlign: "right", fontSize: 28, fontWeight: "bold" },
      }}
      sx={{ mb: 2 }}
    />

    <Box display="grid" gridTemplateColumns="repeat(4,1fr)" gap={1.5}>
      {ROWS.flat().map((l, i) => (
        <Button key={i} sx={getBtnStyle(l)} onClick={() => onPress(l)}>
          {l}
        </Button>
      ))}
    </Box>
  </Box>
);

const GstMode = ({
  gstValue,
  setGstValue,
  gstRate,
  setGstRate,
  result,
  onCalc,
}) => (
  <Box>
    <TextField
      label="Amount (₹)"
      fullWidth
      value={gstValue}
      onChange={(e) => setGstValue(e.target.value)}
      sx={{ mb: 1 }}
    />
    <TextField
      label="GST %"
      type="number"
      fullWidth
      value={gstRate}
      onChange={(e) => setGstRate(e.target.value)}
      sx={{ mb: 1 }}
    />
    <Box display="flex" gap={1}>
      <Button fullWidth variant="contained" onClick={() => onCalc("add")}>
        Add GST
      </Button>
      <Button fullWidth variant="outlined" onClick={() => onCalc("remove")}>
        Remove GST
      </Button>
    </Box>
    {result && (
      <Typography mt={2} fontWeight="bold" textAlign="center">
        Final: {result}
      </Typography>
    )}
  </Box>
);

const DateMode = ({ d1, d2, setD1, setD2, diff, onCalc }) => (
  <Box>
    <TextField
      type="date"
      label="Start"
      fullWidth
      InputLabelProps={{ shrink: true }}
      value={d1}
      onChange={(e) => setD1(e.target.value)}
      sx={{ mb: 1 }}
    />
    <TextField
      type="date"
      label="End"
      fullWidth
      InputLabelProps={{ shrink: true }}
      value={d2}
      onChange={(e) => setD2(e.target.value)}
      sx={{ mb: 1 }}
    />
    <Button fullWidth variant="contained" onClick={onCalc}>
      Calculate Days
    </Button>
    {diff && (
      <Typography mt={2} fontWeight="bold" textAlign="center">
        {diff}
      </Typography>
    )}
  </Box>
);

/* ---------------- MAIN ---------------- */

export default function QuickCalculator() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("basic");
  const [expr, setExpr] = useState("");

  const [gstValue, setGstValue] = useState("");
  const [gstRate, setGstRate] = useState(18);
  const [gstResult, setGstResult] = useState("");

  const [d1, setD1] = useState("");
  const [d2, setD2] = useState("");
  const [dateDiff, setDateDiff] = useState("");

  const ref = useRef(null);

  /* keyboard shortcut */
  useEffect(() => {
    const k = (e) => {
      if (e.ctrlKey && e.key === "g") {
        e.preventDefault();
        setOpen((p) => !p);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  /* outside click */
  useEffect(() => {
    const c = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    if (open) document.addEventListener("mousedown", c);
    return () => document.removeEventListener("mousedown", c);
  }, [open]);

  useEffect(() => {
  const handleKeyDown = (e) => {
    if (!open || mode !== "basic") return;

    const key = e.key;

    // numbers & dot
    if (/^[0-9.]$/.test(key)) {
      setExpr((p) => p + key);
      return;
    }

    // operators
    if (["+", "-", "*", "/", "(", ")"].includes(key)) {
      setExpr((p) => p + key);
      return;
    }

    // percentage
    if (key === "%") {
      setExpr((p) => p + "%");
      return;
    }

    // enter = calculate
    if (key === "Enter") {
      e.preventDefault();
      try {
        setExpr(String(safeEval(expr)));
      } catch {
        setExpr("Error");
      }
      return;
    }

    // backspace
    if (key === "Backspace") {
      setExpr((p) => p.slice(0, -1));
      return;
    }

    // esc close
    if (key === "Escape") {
      setOpen(false);
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [open, mode, expr]);


  const onPress = (l) => {
    if (l === "AC") return setExpr("");

    if (l === "=") {
      try {
        setExpr(String(safeEval(expr)));
      } catch {
        setExpr("Error");
      }
      return;
    }
    setExpr((p) => p + mapToInput(l));
  };

  const calcGST = (t) => {
    const v = Number(gstValue);
    if (!v) return;
    const r = Number(gstRate) / 100;
    const res = t === "add" ? v * (1 + r) : v / (1 + r);
    setGstResult(`₹${res.toFixed(2)}`);
  };

  const calcDate = () => {
    if (!d1 || !d2) return;
    const diff =
      Math.abs(new Date(d2) - new Date(d1)) / (1000 * 60 * 60 * 24);
    setDateDiff(`${Math.ceil(diff)} day(s)`);
  };

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          bgcolor: "#fff",
          boxShadow: 3,
        }}
      >
        <CalculateIcon />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <Paper ref={ref} sx={{ p: 3, borderRadius: 3 }}>
          <Typography align="center" fontWeight="bold" mb={2}>
            Quick Business Calculator
          </Typography>

          <ToggleButtonGroup
            fullWidth
            exclusive
            value={mode}
            onChange={(e, v) => v && setMode(v)}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="basic">Basic</ToggleButton>
            <ToggleButton value="gst">
              <CurrencyRupeeIcon fontSize="small" /> GST
            </ToggleButton>
            <ToggleButton value="date">
              <EventIcon fontSize="small" /> Dates
            </ToggleButton>
          </ToggleButtonGroup>

          {mode === "basic" && (
            <BasicMode expr={expr} setExpr={setExpr} onPress={onPress} />
          )}
          {mode === "gst" && (
            <GstMode
              gstValue={gstValue}
              setGstValue={setGstValue}
              gstRate={gstRate}
              setGstRate={setGstRate}
              result={gstResult}
              onCalc={calcGST}
            />
          )}
          {mode === "date" && (
            <DateMode
              d1={d1}
              d2={d2}
              setD1={setD1}
              setD2={setD2}
              diff={dateDiff}
              onCalc={calcDate}
            />
          )}
        </Paper>
      </Dialog>
    </>
  );
}

