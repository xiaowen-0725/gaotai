"use client";

import { useState } from "react";
import { closedStub, useStore } from "./store-context";

export function SkillsView() {
  const { showToast } = useStore();
  const [tab, setTab] = useState<"Explore" | "Yours">("Explore");

  return (
    <div className="page" data-testid="skills-page">
      <div className="page-head">
        <h1>Skills</h1>
        <div className="skills-head">
          <button className={`pill ${tab === "Explore" ? "active" : ""}`} onClick={() => { setTab("Explore"); closedStub(showToast); }}>
            Explore
          </button>
          <button className={`pill ${tab === "Yours" ? "active" : ""}`} onClick={() => { setTab("Yours"); closedStub(showToast); }}>
            Yours
          </button>
          <input className="search" placeholder="Search" data-testid="skills-search" onClick={() => closedStub(showToast)} readOnly />
          <button className="primary" data-testid="new-skill" onClick={() => closedStub(showToast)}>+ New skill</button>
        </div>
      </div>
      <div className="grid" style={{ marginTop: 20 }}>
        <div className="skill-card">Featured article</div>
        <div className="skill-card">Featured creators</div>
        <div className="skill-card">Editor&apos;s pick 可为空或未开放</div>
      </div>
    </div>
  );
}
