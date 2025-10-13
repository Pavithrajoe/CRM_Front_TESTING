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

const ROWS = [
  ["(", ")", "%", "AC"],
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "−"],
  ["0", ".", "=", "+"],
];

const mapToInput = (label) => {
  if (label === "÷") return "/";
  if (label === "×") return "*";
  if (label === "−") return "-";
  return label;
};

// --- STYLE CONFIG ---
const calculatorButtonBase = {
  height: 65,
  borderRadius: "16px",
  fontWeight: 600,
  fontSize: 18,
  textTransform: "none",
  boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.1)",
  transition: "all 0.1s ease-in-out",
};

const getButtonStyle = (label) => {
  if (label === "AC") return { ...calculatorButtonBase, background: "#EF5350", color: "#fff" };
  if (label === "=") return { ...calculatorButtonBase, background: "#1976D2", color: "#fff" };
  if (["÷", "×", "−", "+"].includes(label))
    return { ...calculatorButtonBase, background: "#f3f4f6", color: "#111" };
  return { ...calculatorButtonBase, background: "#fafafa", color: "#111" };
};

// --- COMPONENTS ---
function BasicMode({ expr, setExpr, handlePress }) {
  return (
    <Box>
      <TextField
        fullWidth
        value={expr || "0"}
        onChange={(e) => setExpr(e.target.value)}
        inputProps={{
          style: {
            textAlign: "right",
            fontSize: 28,
            fontWeight: "bold",
            paddingRight: 10,
          },
        }}
        sx={{
          mb: 2,
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: "#f8fafc",
            height: 70,
          },
        }}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          justifyItems: "center",
        }}
      >
        {ROWS.flat().map((label, index) => (
          <Button
            key={index}
            fullWidth
            sx={getButtonStyle(label)}
            onClick={() => handlePress(label)}
          >
            {label}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

function GstMode({ gstValue, setGstValue, gstRate, setGstRate, handleGst, gstResult }) {
  return (
    <Box sx={{ mt: 1 }}>
      <TextField
        label="Amount (₹)"
        fullWidth
        value={gstValue}
        onChange={(e) => setGstValue(e.target.value)}
        sx={{ mb: 1 }}
      />
      <TextField
        label="GST Rate (%)"
        fullWidth
        type="number"
        value={gstRate}
        onChange={(e) => setGstRate(e.target.value)}
        sx={{ mb: 1 }}
      />
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          fullWidth
          variant="contained"
          sx={{ height: 55, borderRadius: "10px" }}
          onClick={() => handleGst("add")}
        >
          Add GST
        </Button>
        <Button
          fullWidth
          variant="outlined"
          sx={{ height: 55, borderRadius: "10px" }}
          onClick={() => handleGst("remove")}
        >
          Remove GST
        </Button>
      </Box>
      {gstResult && (
        <Typography sx={{ mt: 2, fontWeight: "bold", fontSize: 18, textAlign: "center" }}>
          Final Value: {gstResult}
        </Typography>
      )}
    </Box>
  );
}

function DateMode({ date1, setDate1, date2, setDate2, handleDateDiff, dateDiff }) {
  return (
    <Box sx={{ mt: 1 }}>
      <TextField
        label="Start Date"
        type="date"
        fullWidth
        value={date1}
        onChange={(e) => setDate1(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 1 }}
      />
      <TextField
        label="End Date"
        type="date"
        fullWidth
        value={date2}
        onChange={(e) => setDate2(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 1 }}
      />
      <Button
        fullWidth
        variant="contained"
        sx={{ height: 55, borderRadius: "10px" }}
        onClick={handleDateDiff}
      >
        Calculate Days
      </Button>
      {dateDiff && (
        <Typography sx={{ mt: 2, fontWeight: "bold", fontSize: 18, textAlign: "center" }}>
          Difference: {dateDiff}
        </Typography>
      )}
    </Box>
  );
}

// --- MAIN COMPONENT ---
export default function QuickCalculator() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("basic");
  const [expr, setExpr] = useState("");
  const [gstValue, setGstValue] = useState("");
  const [gstRate, setGstRate] = useState(18);
  const [gstResult, setGstResult] = useState("");
  const [date1, setDate1] = useState("");
  const [date2, setDate2] = useState("");
  const [dateDiff, setDateDiff] = useState("");
  const dialogRef = useRef(null);

  // --- Effects ---
  useEffect(() => {
    const load = (k, setter, num = false) => {
      const v = sessionStorage.getItem(k);
      if (v !== null) setter(num ? parseFloat(v) : v);
    };
    load("calc_mode", setMode);
    load("calc_expr", setExpr);
    load("calc_gstValue", setGstValue);
    load("calc_gstRate", setGstRate, true);
    load("calc_gstResult", setGstResult);
    load("calc_date1", setDate1);
    load("calc_date2", setDate2);
    load("calc_dateDiff", setDateDiff);
  }, []);

  useEffect(() => {
    sessionStorage.setItem("calc_mode", mode);
    sessionStorage.setItem("calc_expr", expr);
    sessionStorage.setItem("calc_gstValue", gstValue);
    sessionStorage.setItem("calc_gstRate", gstRate);
    sessionStorage.setItem("calc_gstResult", gstResult || "");
    sessionStorage.setItem("calc_date1", date1);
    sessionStorage.setItem("calc_date2", date2);
    sessionStorage.setItem("calc_dateDiff", dateDiff || "");
  }, [mode, expr, gstValue, gstRate, gstResult, date1, date2, dateDiff]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        setOpen((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onDoc = (ev) => {
      if (!open) return;
      if (dialogRef.current && !dialogRef.current.contains(ev.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (!open || mode !== "basic") return;
      const k = e.key;
      if (/^[0-9.]$/.test(k)) {
        setExpr((p) => p + k);
        return;
      }
      if (["+", "-", "*", "/", "(", ")", "%"].includes(k)) {
        setExpr((p) => p + k);
        return;
      }
      if (k === "Enter") {
        e.preventDefault();
        handleEquals();
        return;
      }
      if (k === "Backspace") {
        setExpr((p) => p.slice(0, -1));
        return;
      }
      if (k === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, expr, mode]);

  // --- Handlers ---
  const handleEquals = () => {
    try {
      let clean = expr.replace(/[+\-*/.]+$/, "");
      // eslint-disable-next-line no-eval
      const res = eval(clean || "0");
      setExpr(String(res));
    } catch {
      setExpr("Error");
    }
  };

  const applyPercent = () => {
    try {
      // eslint-disable-next-line no-eval
      const val = eval(expr || "0");
      setExpr(String(val / 100));
    } catch {
      setExpr("Error");
    }
  };

  const handlePress = (label) => {
    if (label === "AC") return setExpr("");
    if (label === "%") return applyPercent();
    if (label === "=") return handleEquals();
    setExpr((p) => p + mapToInput(label));
  };

  const handleGst = (type) => {
    const v = parseFloat(gstValue);
    if (isNaN(v)) return setGstResult("");
    const rate = parseFloat(gstRate) || 0;
    const factor = 1 + rate / 100;
    setGstResult(`₹${(type === "add" ? v * factor : v / factor).toFixed(2)}`);
  };

  const handleDateDiff = () => {
    if (!date1 || !date2) return setDateDiff("");
    const s = new Date(date1);
    const e = new Date(date2);
    if (isNaN(s) || isNaN(e)) return setDateDiff("Invalid date(s)");
    const diff = Math.abs(e - s);
    setDateDiff(`${Math.ceil(diff / (1000 * 60 * 60 * 24))} day(s)`);
  };

  // --- Render ---
  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          background: "#fff",
          color: "#1565c0",
          borderRadius: "50%",
          boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
        }}
        aria-label="open-calculator"
      >
        <CalculateIcon />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <Paper
          ref={dialogRef}
          elevation={8}
          sx={{
            borderRadius: "20px",
            p: 3,
            backgroundColor: "#fff",
            mx: 1,
          }}
        >
          <Typography
            variant="h6"
            align="center"
            sx={{ mb: 2, color: "#1565c0", fontWeight: "bold" }}
          >
            Quick Business Calculator
          </Typography>

          <Box textAlign="center" sx={{ mb: 3 }}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(e, v) => v && setMode(v)}
              size="small"
            >
              <ToggleButton value="basic">Basic</ToggleButton>
              <ToggleButton value="gst">
                <CurrencyRupeeIcon sx={{ fontSize: 16, mr: 0.5 }} /> GST
              </ToggleButton>
              <ToggleButton value="date">
                <EventIcon sx={{ fontSize: 16, mr: 0.5 }} /> Dates
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {mode === "basic" && <BasicMode expr={expr} setExpr={setExpr} handlePress={handlePress} />}
          {mode === "gst" && (
            <GstMode
              gstValue={gstValue}
              setGstValue={setGstValue}
              gstRate={gstRate}
              setGstRate={setGstRate}
              handleGst={handleGst}
              gstResult={gstResult}
            />
          )}
          {mode === "date" && (
            <DateMode
              date1={date1}
              setDate1={setDate1}
              date2={date2}
              setDate2={setDate2}
              handleDateDiff={handleDateDiff}
              dateDiff={dateDiff}
            />
          )}
        </Paper>
      </Dialog>
    </>
  );
}
