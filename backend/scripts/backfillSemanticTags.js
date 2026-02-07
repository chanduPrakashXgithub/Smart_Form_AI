/**
 * Migration Script: Backfill Semantic Tags
 * 
 * Purpose: Add semantic tags to existing VaultField records
 * This enables intelligent field mapping for data entered before the semantic system was implemented.
 * 
 * Usage: node scripts/backfillSemanticTags.js
 */

import mongoose from 'mongoose';
import VaultField from '../models/VaultField.js';
import { classifyFieldSemantic } from '../services/formAIService.js';
import '../config/database.js';  // Connect to MongoDB

const backfillSemanticTags = async () => {
  try {
    console.log('🚀 Starting semantic tag backfill migration...\n');

    // Get all vault fields without semantic tags
    const fieldsWithoutTags = await VaultField.find({
      $or: [
        { semanticTag: null },
        { semanticTag: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${fieldsWithoutTags.length} fields without semantic tags\n`);

    if (fieldsWithoutTags.length === 0) {
      console.log('✅ All vault fields already have semantic tags. Migration complete!');
      process.exit(0);
    }

    let updatedCount = 0;
    let skippedCount = 0;
    const tagStats = {};

    // Process each field
    for (const field of fieldsWithoutTags) {
      const semanticTag = classifyFieldSemantic(field.fieldName);

      if (semanticTag) {
        // Update field with semantic tag
        field.semanticTag = semanticTag;
        await field.save();
        updatedCount++;

        // Track tag distribution
        tagStats[semanticTag] = (tagStats[semanticTag] || 0) + 1;

        console.log(`✅ Updated: "${field.fieldName}" → ${semanticTag}`);
      } else {
        skippedCount++;
        console.log(`⚠️  Skipped: "${field.fieldName}" (no semantic match)`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total fields processed: ${fieldsWithoutTags.length}`);
    console.log(`✅ Successfully tagged: ${updatedCount}`);
    console.log(`⚠️  Skipped (no match): ${skippedCount}`);
    console.log('\n📊 Tag Distribution:');
    
    Object.entries(tagStats)
      .sort((a, b) => b[1] - a[1])  // Sort by count descending
      .forEach(([tag, count]) => {
        console.log(`   ${tag}: ${count} fields`);
      });

    console.log('\n✨ Migration completed successfully!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
backfillSemanticTags();
