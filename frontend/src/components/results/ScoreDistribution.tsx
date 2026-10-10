import { Box, Card, CardContent, Tooltip, Typography } from "@mui/material";
import { he } from "../../i18n/he";
import { brand, statusTones } from "../../theme/brand";
import { scoreTone, type DistributionBucket } from "../../utils/resultsStats";

const CHART_HEIGHT = 120;

function Bar({ bucket, max }: { bucket: DistributionBucket; max: number }) {
  const tone = statusTones[scoreTone(bucket.from + 5)];
  const height = bucket.count === 0 ? 3 : Math.max(8, (bucket.count / max) * CHART_HEIGHT);
  return (
    <Tooltip title={`${bucket.from}–${bucket.to}%: ${he.resultsDistributionCount(bucket.count)}`}>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: CHART_HEIGHT + 22 }}>
        <Typography variant="caption" fontWeight={700} sx={{ visibility: bucket.count ? "visible" : "hidden" }}>
          {bucket.count}
        </Typography>
        <Box sx={{ width: "70%", height, borderRadius: "6px 6px 2px 2px", bgcolor: bucket.count ? tone.fg : brand.slate200, opacity: bucket.count ? 0.9 : 1 }} />
      </Box>
    </Tooltip>
  );
}

function AxisLabels({ buckets }: { buckets: DistributionBucket[] }) {
  return (
    <Box sx={{ display: "flex", mt: 0.5 }}>
      {buckets.map((b) => (
        <Typography key={b.from} variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: "center" }}>
          {b.from}
        </Typography>
      ))}
    </Box>
  );
}

/** Histogramme des notes par tranches de 10 % (axe de gauche à droite, 0 → 100). */
export default function ScoreDistribution({ buckets, graded }: { buckets: DistributionBucket[]; graded: number }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
          {he.resultsDistributionTitle}
        </Typography>
        {graded === 0 ? (
          <Typography color="text.secondary">{he.resultsDistributionEmpty}</Typography>
        ) : (
          <Box dir="ltr">
            <Box sx={{ display: "flex", alignItems: "flex-end", borderBottom: `1px solid ${brand.slate200}` }}>
              {buckets.map((b) => (
                <Bar key={b.from} bucket={b} max={max} />
              ))}
            </Box>
            <AxisLabels buckets={buckets} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
