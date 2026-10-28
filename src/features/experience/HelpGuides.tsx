import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Select } from '@/ds'
import { api } from '@/lib/api/client'
import type { PublicConfig } from '@/lib/api/publicConfig'
import './experience.css'

export function HelpGuides({ guides = [] }: { guides?: PublicConfig['help']['guides'] }) {
  const [language, setLanguage] = useState('fr')
  const visible = guides.filter(g => g.language === language)
  return <section className="experience-stack" aria-label="Consignes courtes" style={{ marginBottom: 24 }}>
    <Select label="Langue des consignes" value={language} onChange={e => setLanguage(e.target.value)} options={[{value:'fr',label:'Français'},{value:'wo',label:'Wolof'}]} />
    {visible.map(g => <Card key={`${language}-${g.id}`}><h2>{g.title}</h2><p lang={language}>{g.text}</p>{g.audioUrl && <audio controls preload="none" aria-label={`Écouter : ${g.title}`} src={new URL(g.audioUrl, new URL(api.defaults.baseURL || '/api/v1', window.location.origin)).href} style={{ width:'100%' }} />}</Card>)}
    {visible.length === 0 && <p>Les consignes {language === 'wo' ? 'en wolof' : 'en français'} ne sont pas encore disponibles. <Link to="/support">Demander de l’aide au support</Link>.</p>}
  </section>
}
