/**
 * Diagnostic script to check Clerk organization count and details
 * Run with: node scripts/check-clerk-orgs.js
 */

const { clerkClient } = require('@clerk/clerk-sdk-node');

async function checkOrganizations() {
  try {
    console.log('🔍 Checking Clerk organizations...\n');

    // Fetch all organizations
    const { data: organizations, totalCount } = await clerkClient.organizations.getOrganizationList({
      limit: 100,
      offset: 0,
    });

    console.log(`📊 Total organizations: ${totalCount}`);
    console.log(`📋 Organizations returned: ${organizations.length}\n`);

    if (organizations.length === 0) {
      console.log('✅ No organizations found.');
      return;
    }

    console.log('Organizations:\n');
    organizations.forEach((org, index) => {
      console.log(`${index + 1}. ${org.name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Slug: ${org.slug}`);
      console.log(`   Created: ${new Date(org.createdAt).toLocaleString()}`);
      console.log(`   Members: ${org.membersCount || 'N/A'}`);
      console.log('');
    });

    // Check if we're near any limits
    if (totalCount >= 90) {
      console.log('⚠️  WARNING: You are approaching the 100 organization limit on the free plan.');
      console.log('   Consider upgrading to Clerk Pro or cleaning up test organizations.\n');
    } else if (totalCount >= 100) {
      console.log('🚨 LIMIT REACHED: You have hit the 100 organization limit.');
      console.log('   You must delete organizations or upgrade your plan.\n');
    } else {
      console.log(`✅ You are using ${totalCount}/100 organizations (${100 - totalCount} remaining)\n`);
    }

  } catch (error) {
    console.error('❌ Error checking organizations:', error.message);
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
  }
}

checkOrganizations();
