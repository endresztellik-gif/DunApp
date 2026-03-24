/**
 * SvgSprite Component
 *
 * Injects the DunApp icon sprite inline into the document.
 * Must be rendered once near the root of the app.
 * Icons are referenced elsewhere via <use href="#icon-id" />.
 *
 * Inline sprites are more reliable than external SVG <use href="file.svg#id">
 * which can fail due to browser security policies or caching issues.
 */

export const SvgSprite = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'none' }}
    aria-hidden="true"
  >
    {/* Meteorológia — nap + felhő */}
    <symbol id="icon-meteo" viewBox="0 0 24 24">
      <circle cx="10" cy="9" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="10" y1="2" x2="10" y2="3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="10" y1="14.4" x2="10" y2="16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="3" y1="9" x2="4.6" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="15.4" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="5.05" y1="5.05" x2="6.18" y2="6.18" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="13.82" y1="11.82" x2="14.95" y2="12.95" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="14.95" y1="5.05" x2="13.82" y2="6.18" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M7 18 Q7 14.5 10.5 14.5 Q10 12 13 12.8 Q14.5 10.5 17 12 Q20 11.5 20 14.5 Q22 14.5 22 17 Q22 20 19 20 H10 Q7 20 7 18Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </symbol>

    {/* Meteorológia — kitöltött variáns */}
    <symbol id="icon-meteo-fill" viewBox="0 0 24 24">
      <circle cx="10" cy="9" r="3.5" fill="currentColor" opacity={0.9}/>
      <line x1="10" y1="2" x2="10" y2="3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="10" y1="14.4" x2="10" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3" y1="9" x2="4.6" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="15.4" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="5.05" y1="5.05" x2="6.18" y2="6.18" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="14.95" y1="5.05" x2="13.82" y2="6.18" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M7 18 Q7 14.5 10.5 14.5 Q10 12 13 12.8 Q14.5 10.5 17 12 Q20 11.5 20 14.5 Q22 14.5 22 17 Q22 20 19 20 H10 Q7 20 7 18Z" fill="currentColor" opacity={0.75}/>
    </symbol>

    {/* Vízállás — mérőléc + emelkedő nyíl */}
    <symbol id="icon-water" viewBox="0 0 24 24">
      <rect x="6" y="3" width="12" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="6" y1="7"  x2="9"  y2="7"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity={0.5}/>
      <line x1="6" y1="10" x2="8"  y2="10" stroke="currentColor" strokeWidth="1"   strokeLinecap="round" opacity={0.35}/>
      <line x1="6" y1="13" x2="9"  y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity={0.5}/>
      <line x1="6" y1="16" x2="8"  y2="16" stroke="currentColor" strokeWidth="1"   strokeLinecap="round" opacity={0.35}/>
      <line x1="6" y1="19" x2="9"  y2="19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity={0.5}/>
      <rect x="6.8" y="13.5" width="10.4" height="6.8" rx="1" fill="currentColor" opacity={0.18}/>
      <path d="M7 13.5 Q9 12 11 13.5 Q13 15 15 13.5 Q16.5 12.5 17 13.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="15" y1="13" x2="15" y2="7"  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M12.5 9 L15 6.5 L17.5 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </symbol>

    {/* Vízállás — csökkenő nyíl */}
    <symbol id="icon-water-down" viewBox="0 0 24 24">
      <rect x="6" y="3" width="12" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="6" y1="7"  x2="9"  y2="7"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity={0.5}/>
      <line x1="6" y1="10" x2="8"  y2="10" stroke="currentColor" strokeWidth="1"   strokeLinecap="round" opacity={0.35}/>
      <line x1="6" y1="13" x2="9"  y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity={0.5}/>
      <line x1="6" y1="16" x2="8"  y2="16" stroke="currentColor" strokeWidth="1"   strokeLinecap="round" opacity={0.35}/>
      <line x1="6" y1="19" x2="9"  y2="19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity={0.5}/>
      <rect x="6.8" y="15" width="10.4" height="5.2" rx="1" fill="currentColor" opacity={0.18}/>
      <path d="M7 15 Q9 13.5 11 15 Q13 16.5 15 15 Q16.5 14 17 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="15" y1="8" x2="15" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M12.5 12 L15 14.5 L17.5 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </symbol>

    {/* Aszályindikátor — nap + repedés */}
    <symbol id="icon-drought" viewBox="0 0 24 24">
      <circle cx="12" cy="9" r="3.8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="12" y1="2"    x2="12" y2="3.8"  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="19"  y1="9"   x2="17.2" y2="9"   stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="5"   y1="9"   x2="6.8"  y2="9"   stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="16.95" y1="5.05" x2="15.66" y2="6.34" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="7.05"  y1="5.05" x2="8.34"  y2="6.34" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="2" y1="16" x2="22" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.7}/>
      <path d="M5  16 L6.5 19.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M6.5 19.5 L9 17.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M9 17.5 L10.5 21" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M14 16 L16.5 19"  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M16.5 19 L19 17"  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </symbol>

    {/* Aszályindikátor — extrém variáns */}
    <symbol id="icon-drought-severe" viewBox="0 0 24 24">
      <circle cx="12" cy="8.5" r="4.2" fill="currentColor" opacity={0.15}/>
      <circle cx="12" cy="8.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6"/>
      <line x1="12" y1="1.5" x2="12" y2="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="19.5" y1="8.5" x2="17.5" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="4.5" y1="8.5" x2="6.5" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="17.3" y1="4.7" x2="15.8" y2="6.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="6.7" y1="4.7" x2="8.2" y2="6.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="2" y1="15.5" x2="22" y2="15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M4 15.5 L5.5 19 L8 17 L9.5 22"  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 15.5 L15 19 L18 16.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </symbol>

    {/* Talajvíz — kút + rétegek */}
    <symbol id="icon-groundwater" viewBox="0 0 24 24">
      <rect x="9" y="2" width="6" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 12 Q12 10 22 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity={0.6}/>
      <path d="M2 15 Q12 13.5 22 15" fill="none" stroke="currentColor" strokeWidth="1"   strokeLinecap="round" opacity={0.35}/>
      <path d="M2 18.5 Q12 17 22 18.5" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity={0.25}/>
      <path d="M2 15.5 Q12 14 22 15.5 L22 22 L2 22 Z" fill="currentColor" opacity={0.12}/>
      <line x1="12" y1="11" x2="12" y2="16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="1.5 2" opacity={0.5}/>
      <path d="M12 16.5 Q10.5 18 10.5 19.2 Q10.5 21 12 21 Q13.5 21 13.5 19.2 Q13.5 18 12 16.5Z" fill="currentColor" opacity={0.45}/>
      <line x1="19" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.5" opacity={0.4}/>
      <line x1="19" y1="16" x2="21" y2="16" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.5" opacity={0.4}/>
      <line x1="20" y1="12" x2="20" y2="16" stroke="currentColor" strokeWidth="0.8" opacity={0.3}/>
    </symbol>

    {/* Értesítési harang */}
    <symbol id="icon-alert-bell" viewBox="0 0 24 24">
      <path d="M12 3 Q8 3 7 7 L6 15 Q5 16 4 17 H20 Q19 16 18 15 L17 7 Q16 3 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 17 Q9.5 15.5 11 17 Q12 18.2 13 17 Q14.5 15.5 15 17" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="12" cy="3" r="1" fill="currentColor" opacity={0.7}/>
      <path d="M10 20 Q12 22 14 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </symbol>

    {/* Monitoring állomás — pin + hullámok */}
    <symbol id="icon-station" viewBox="0 0 24 24">
      <path d="M12 2 C8.5 2 6 5 6 8 C6 12.5 12 20 12 20 C12 20 18 12.5 18 8 C18 5 15.5 2 12 2Z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="8.5" r="2.5" fill="currentColor" opacity={0.4}/>
      <path d="M5 17 Q8.5 15 12 17 Q15.5 19 19 17" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity={0.4}/>
      <path d="M3 20 Q7.5 17.5 12 20 Q16.5 22.5 21 20" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity={0.25}/>
    </symbol>

    {/* Vonaldiagram */}
    <symbol id="icon-chart" viewBox="0 0 24 24">
      <line x1="3" y1="20" x2="21" y2="20" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity={0.4}/>
      <line x1="4" y1="4"  x2="4"  y2="20" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity={0.4}/>
      <polyline points="4,16 7,12 10,14 13,8 17,10 21,6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7"  cy="12" r="1.5" fill="currentColor"/>
      <circle cx="13" cy="8"  r="1.5" fill="currentColor"/>
      <circle cx="21" cy="6"  r="1.5" fill="currentColor"/>
    </symbol>
  </svg>
);
