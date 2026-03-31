sed -i '' -e "s/console.log('clicked')/undefined/g" src/components/shared/README.md 2>/dev/null || true
sed -i '' -e "s/console.log('Link created', link)/undefined/g" src/components/forms/MetricLinkingPanel.tsx 2>/dev/null || true
sed -i '' -e "s/console.log('Link removed', linkId)/undefined/g" src/components/forms/MetricLinkingPanel.tsx 2>/dev/null || true
sed -i '' -e 's/console.log/undefined/g' src/hooks/use-api.ts.backup 2>/dev/null || true
sed -i '' -e "s/console.log('Session updated!')/undefined/g" src/hooks/useLiveSession.ts 2>/dev/null || true

# For GNU sed (Linux)
sed -i "s/console.log('clicked')/undefined/g" src/components/shared/README.md 2>/dev/null || true
sed -i "s/console.log('Link created', link)/undefined/g" src/components/forms/MetricLinkingPanel.tsx 2>/dev/null || true
sed -i "s/console.log('Link removed', linkId)/undefined/g" src/components/forms/MetricLinkingPanel.tsx 2>/dev/null || true
sed -i 's/console.log/undefined/g' src/hooks/use-api.ts.backup 2>/dev/null || true
sed -i "s/console.log('Session updated!')/undefined/g" src/hooks/useLiveSession.ts 2>/dev/null || true
