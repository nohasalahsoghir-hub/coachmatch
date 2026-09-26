import Link from "next/link";
import { FlaskConical } from "lucide-react";
export function DemoBanner(){return <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-100"><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><FlaskConical size={14}/> وضع تجريبي — كل البيانات المعروضة وهمية</span><Link href="/demo" className="font-bold underline">رحلة العرض</Link></div></div>}
