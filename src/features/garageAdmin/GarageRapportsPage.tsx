import { PeriodReportView } from '@/components/PeriodReportView'
import * as reportsApi from '@/lib/api/reports'

/**
 * Rapports de la zone de l'admin connecté.
 *
 * Les chiffres viennent de `/garage-admin/reports/*`, dont le périmètre est
 * limité à la zone côté API — l'écran ne recalcule rien à partir d'une page de
 * colis, et n'affiche plus de série d'activité factice.
 */
export function GarageRapportsPage() {
  return (
    <PeriodReportView
      scope="garage"
      fetchDaily={(date) => reportsApi.garageDaily(date)}
      fetchMonthly={(year, month) => reportsApi.garageMonthly(year, month)}
      onExport={() => reportsApi.garageExport()}
      exportName="zone-colis"
    />
  )
}
