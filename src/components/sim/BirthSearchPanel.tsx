"use client";

import { useState, type FormEvent } from "react";
import { ELEMENTS } from "./data";
import type { Gender, WebMenh } from "@/lib/api/sims";

export interface BirthInfo {
  // YYYY-MM-DD
  date: string;
  gender: Gender;
}

interface Props {
  // NAM_SINH: numbers ending with the birth year; PHONG_THUY: numbers of
  // the visitor's mệnh.
  mode: "NAM_SINH" | "PHONG_THUY";
  value: BirthInfo | null;
  onChange: (value: BirthInfo | null) => void;
  menh?: WebMenh;
  menhLoading?: boolean;
  menhError?: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (iso: string) => iso.split("-").reverse().join("/");

export function BirthSearchPanel({ mode, value, onChange, menh, menhLoading, menhError }: Props) {
  const [date, setDate] = useState(value?.date ?? "");
  const [gender, setGender] = useState<Gender>(value?.gender ?? "male");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (date) onChange({ date, gender });
  };

  const element = menh?.element ? ELEMENTS.find((item) => item.code === `MENH_${menh.element}`) : undefined;

  return (
    <section className="birth-panel" aria-label={mode === "NAM_SINH" ? "Tìm sim năm sinh" : "Tìm sim phong thủy"}>
      <h2>{mode === "NAM_SINH" ? "Tìm sim theo năm sinh" : "Tìm sim hợp mệnh"}</h2>
      <p>
        {mode === "NAM_SINH"
          ? "Nhập ngày sinh để xem các số có đuôi là năm sinh của bạn."
          : "Nhập ngày sinh để xác định mệnh ngũ hành theo năm âm lịch và xem các số hợp mệnh."}
      </p>
      <form onSubmit={submit}>
        <label className="birth-field">
          Ngày sinh
          <input type="date" required min="1900-01-01" max={today()} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <fieldset className="birth-field">
          <legend>Giới tính</legend>
          <div className="gender-options">
            {(
              [
                ["male", "Nam"],
                ["female", "Nữ"],
              ] as const
            ).map(([option, label]) => (
              <label key={option} className={gender === option ? "active" : undefined}>
                <input
                  type="radio"
                  name="gender"
                  value={option}
                  checked={gender === option}
                  onChange={() => setGender(option)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <button className="primary" disabled={!date}>
          {mode === "NAM_SINH" ? "Tìm số năm sinh" : "Xem số hợp mệnh"}
        </button>
        {value && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setDate("");
              onChange(null);
            }}
          >
            Bỏ chọn
          </button>
        )}
      </form>

      {value && mode === "NAM_SINH" && (
        <p className="birth-result">
          Đang hiển thị số có đuôi <b>{value.date.slice(0, 4)}</b> (sinh ngày {formatDate(value.date)}).
        </p>
      )}
      {value && mode === "PHONG_THUY" && (
        <div className="birth-result" aria-live="polite">
          {menhLoading ? (
            "Đang tính mệnh…"
          ) : menhError ? (
            menhError
          ) : menh ? (
            <>
              Sinh ngày {formatDate(menh.birth_date)} — âm lịch {menh.lunar_date.day}/{menh.lunar_date.month}/
              {menh.lunar_date.year}, năm <b>{menh.can_chi}</b>.{" "}
              {element ? (
                <>
                  Mệnh{" "}
                  <b>
                    {element.icon} {element.label}
                  </b>
                  {menh.sim_type ? " — đang hiển thị các số hợp mệnh." : " — cửa hàng chưa mở loại sim cho mệnh này."}
                </>
              ) : (
                "Chưa có dữ liệu mệnh cho năm âm lịch này (hỗ trợ 1950–2020)."
              )}
            </>
          ) : null}
        </div>
      )}
    </section>
  );
}
