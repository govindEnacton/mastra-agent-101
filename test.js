// check-free-models.js
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

async function findFreeModels() {
  try {
    const response = await fetch(OPENROUTER_MODELS_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const models = data.data || [];

    // Filter for models that are free AND support tool calling
    const freeToolModels = models.filter(model => {
      const isFree = 
        model.pricing?.prompt === '0' && 
        model.pricing?.completion === '0';
      
      const supportsTools = 
        model.supported_parameters?.includes('tools') ||
        model.supported_parameters?.includes('tool_choice');
      
      return isFree && supportsTools;
    });

    if (freeToolModels.length === 0) {
      console.log('No free models with tool calling found.');
      return;
    }

    console.log(`Found ${freeToolModels.length} free model(s) with tool calling:\n`);
    
    freeToolModels.forEach(model => {
      const context = model.context_length 
        ? `${Math.round(model.context_length / 1000)}K` 
        : 'N/A';
      
      console.log(`  ${model.id}`);
      console.log(`    Context: ${context} | Name: ${model.name || 'N/A'}`);
      console.log('');
    });

    // Show which one to use
    console.log('─'.repeat(50));
    console.log('Recommended Mastra model string:');
    console.log(`  openrouter/${freeToolModels[0].id}`);
    console.log('');
    console.log('Or use the auto-router (picks a random free model):');
    console.log('  openrouter/free');

  } catch (error) {
    console.error('Error fetching models:', error.message);
  }
}

findFreeModels();
