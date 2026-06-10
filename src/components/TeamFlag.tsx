/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Team } from "../types";

export const TEAM_FLAG_CODES: Record<string, string> = {
  // Group A
  mexico: "mx",
  southafrica: "za",
  korea: "kr",
  czech: "cz",

  // Group B
  canada: "ca",
  bosnia: "ba",
  qatar: "qa",
  switzerland: "ch",

  // Group C
  brazil: "br",
  morocco: "ma",
  haiti: "ht",
  scotland: "gb-sct",

  // Group D
  usa: "us",
  paraguay: "py",
  australia: "au",
  turkey: "tr",

  // Group E
  germany: "de",
  curacao: "cw",
  ivorycoast: "ci",
  ecuador: "ec",

  // Group F
  netherlands: "nl",
  japan: "jp",
  sweden: "se",
  tunisia: "tn",

  // Group G
  belgium: "be",
  egypt: "eg",
  iran: "ir",
  newzealand: "nz",

  // Group H
  spain: "es",
  capeverde: "cv",
  saudi: "sa",
  uruguay: "uy",

  // Group I
  france: "fr",
  senegal: "sn",
  iraq: "iq",
  norway: "no",

  // Group J
  argentina: "ar",
  algeria: "dz",
  austria: "at",
  jordan: "jo",

  // Group K
  portugal: "pt",
  drcongo: "cd",
  uzbekistan: "uz",
  colombia: "co",

  // Group L
  england: "gb-eng",
  croatia: "hr",
  ghana: "gh",
  panama: "pa",

  // Extra/Legacy mappings just in case
  wales: "gb-wls",
  uae: "ae",
  poland: "pl",
  denmark: "dk",
  costarica: "cr",
  serbia: "rs",
  cameroon: "cm"
};

interface TeamFlagProps {
  team: Team;
  className?: string;
  style?: React.CSSProperties;
}

export const TeamFlag: React.FC<TeamFlagProps> = ({ team, className = "w-8 h-5", style }) => {
  const code = TEAM_FLAG_CODES[team.id];
  if (!code) {
    // If it's a placeholder team or doesn't have a code, render the emoji/placeholder symbol gracefully
    return (
      <span className={`text-2xl filter drop-shadow ${className}`} style={style} role="img" aria-label={team.name}>
        {team.flag}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
      alt={`پرچم ${team.name}`}
      className={`inline-block rounded border border-white/15 shadow-sm object-cover select-none ${className}`}
      style={style}
      referrerPolicy="no-referrer"
    />
  );
};
