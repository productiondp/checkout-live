const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * CHECKOUT CREATORS - DAILY KPI SCRIPT
 * Run this script daily to track funnel metrics and identify friction points.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function generateDailyReport() {
  console.log("📊 Generating Daily Launch Mode KPIs...\n");

  try {
    // 1. Activation Metrics
    const { count: totalCreators } = await supabase.from('creator_profiles').select('*', { count: 'exact', head: true });
    const { count: totalOpportunities } = await supabase.from('opportunities').select('*', { count: 'exact', head: true });
    
    // 2. Conversion Metrics (Bottom Funnel)
    const { count: fundedEscrows } = await supabase.from('escrows').select('*', { count: 'exact', head: true }).eq('status', 'FUNDED');
    const { count: releasedEscrows } = await supabase.from('escrows').select('*', { count: 'exact', head: true }).eq('status', 'RELEASED');
    
    // 3. Revenue Metrics
    const { data: commissions } = await supabase.from('commissions').select('amount');
    const totalRevenue = commissions?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

    console.log(`--- MARKETPLACE LIQUIDITY ---`);
    console.log(`Active Creators: ${totalCreators}`);
    console.log(`Open Opportunities: ${totalOpportunities}`);
    console.log(`Avg Creators/Opportunity: ${(totalCreators / (totalOpportunities || 1)).toFixed(1)}`);
    
    console.log(`\n--- TRANSACTIONS & REVENUE ---`);
    console.log(`Active Escrows (Money Locked): ${fundedEscrows}`);
    console.log(`Completed Projects (Money Paid): ${releasedEscrows}`);
    console.log(`Total Platform Revenue: $${totalRevenue.toFixed(2)}`);
    
    console.log(`\n--- FRICTION ANALYSIS ---`);
    if (fundedEscrows > releasedEscrows * 2) {
      console.log("⚠️ FRICTION DETECTED: High number of escrows are funded but not released. Businesses may be stalling on milestone approvals.");
    } else {
      console.log("✅ Funnel flow is healthy.");
    }
    
  } catch (err) {
    console.error("Failed to generate report. Ensure database is accessible.", err);
  }
}

generateDailyReport();
