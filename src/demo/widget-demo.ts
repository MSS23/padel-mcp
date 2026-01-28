/**
 * ChatGPT Widget Demo
 *
 * Generates standalone HTML files for testing ChatGPT widgets with mock data.
 * Run with: npm run demo:widgets
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { bundleWidget } from '../widget-renderer/bundler.js';
import { findAvailableGames } from '../services/playtomic.js';
import { geocodeAddress } from '../services/geocoding.js';
import { getWeatherForSlot } from '../services/weather.js';
import { generateSlotBookingUrl } from '../utils/booking.js';
import { generateSlotCalendarLink } from '../utils/calendar.js';
import type { EnhancedTimeSlot } from '../types/index.js';

const OUTPUT_DIR = join(process.cwd(), 'demo', 'output');

/**
 * Generate mock EnhancedTimeSlot data for demo
 */
async function generateMockSlots(): Promise<EnhancedTimeSlot[]> {
  console.log('Generating mock slot data...');

  // Use London coordinates for demo
  const londonCoords = await geocodeAddress('London');
  if (!londonCoords) {
    throw new Error('Failed to geocode London');
  }

  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  // Find available games
  const slots = await findAvailableGames(
    londonCoords,
    dateStr,
    '10:00',
    '20:00',
    15, // 15km radius
    'London'
  );

  // Enhance slots with weather and booking links
  const enhancedSlots: EnhancedTimeSlot[] = [];

  for (const slot of slots.slice(0, 20)) { // Limit to 20 slots for demo
    // Get venue coordinates (use London center as fallback)
    const venueCoords = londonCoords;

    // Generate booking URL
    const bookingUrl = generateSlotBookingUrl({
      venueId: slot.venue_id,
      startTime: slot.start_time,
      platform: 'playtomic',
    });

    // Generate calendar link
    const calendarLink = generateSlotCalendarLink({
      venueName: slot.venue_name,
      venueAddress: `${slot.venue_name}, London`,
      courtName: slot.court_name,
      startTime: slot.start_time,
      endTime: slot.end_time,
      price: slot.price,
      currency: slot.currency,
      bookingUrl: bookingUrl ?? undefined,
    });

    const enhanced: EnhancedTimeSlot = {
      ...slot,
      booking_url: bookingUrl ?? undefined,
      calendar_link: calendarLink,
      venue_address: `${slot.venue_name}, London`,
      venue_coordinates: venueCoords,
    };

    // Add weather info
    try {
      const weather = await getWeatherForSlot(venueCoords, slot.start_time);
      if (weather) {
        enhanced.weather = weather;
      }
    } catch (error) {
      console.warn(`Failed to get weather for slot ${slot.start_time}:`, error);
    }

    enhancedSlots.push(enhanced);
  }

  return enhancedSlots;
}

/**
 * Create enhanced HTML with mock window.openai API for browser testing
 */
function enhanceHTMLForDemo(html: string): string {
  // Inject mock window.openai implementation before closing body tag
  const mockOpenAIScript = `
  <script>
    // Mock window.openai API for browser testing
    window.openai = {
      callTool: async function(params) {
        console.log('🔧 Mock ChatGPT Tool Call:', params);
        alert('Mock ChatGPT Tool Call:\\n' + JSON.stringify(params, null, 2));
        return { success: true, message: 'Mock tool call executed' };
      },
      requestDisplayMode: function(mode) {
        console.log('📺 Request Display Mode:', mode);
        alert('Request Display Mode: ' + mode);
      }
    };
    
    console.log('✅ Mock window.openai API loaded');
    console.log('Try calling: window.openai.callTool({ toolName: "test", params: { foo: "bar" } })');
  </script>
  `;

  // Insert before closing body tag
  return html.replace('</body>', mockOpenAIScript + '</body>');
}

/**
 * Generate demo HTML files for all widgets
 */
async function generateDemoFiles(): Promise<void> {
  console.log('🚀 Starting ChatGPT Widget Demo Generation\n');

  // Create output directory
  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}\n`);
  } catch (error) {
    // Directory might already exist
  }

  // Generate mock slot data
  const slots = await generateMockSlots();
  console.log(`✅ Generated ${slots.length} mock slots\n`);

  const sessionId = `demo-${Date.now()}`;

  // 1. SlotCards Widget
  console.log('📦 Generating SlotCards widget...');
  try {
    const slotCardsBundle = await bundleWidget('SlotCards', {
      slots,
      groupByVenue: true,
      widgetSessionId: sessionId,
      title: `🎾 ${slots.length} Available Slots - Demo`,
    });
    const slotCardsHTML = enhanceHTMLForDemo(slotCardsBundle.html);
    await writeFile(join(OUTPUT_DIR, 'SlotCards.html'), slotCardsHTML, 'utf-8');
    console.log('   ✅ SlotCards.html generated\n');
  } catch (error) {
    console.error('   ❌ Failed to generate SlotCards:', error);
  }

  // 2. SearchForm Widget
  console.log('📦 Generating SearchForm widget...');
  try {
    const searchFormBundle = await bundleWidget('SearchForm', {
      initialLocation: 'London',
      initialDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      initialTimeStart: '10:00',
      initialTimeEnd: '20:00',
      widgetSessionId: sessionId,
    });
    const searchFormHTML = enhanceHTMLForDemo(searchFormBundle.html);
    await writeFile(join(OUTPUT_DIR, 'SearchForm.html'), searchFormHTML, 'utf-8');
    console.log('   ✅ SearchForm.html generated\n');
  } catch (error) {
    console.error('   ❌ Failed to generate SearchForm:', error);
  }

  // 3. WeeklyCalendar Widget
  console.log('📦 Generating WeeklyCalendar widget...');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startDate = tomorrow.toISOString().split('T')[0];

    const weeklyCalendarBundle = await bundleWidget('WeeklyCalendar', {
      slots,
      startDate,
      widgetSessionId: sessionId,
    });
    const weeklyCalendarHTML = enhanceHTMLForDemo(weeklyCalendarBundle.html);
    await writeFile(join(OUTPUT_DIR, 'WeeklyCalendar.html'), weeklyCalendarHTML, 'utf-8');
    console.log('   ✅ WeeklyCalendar.html generated\n');
  } catch (error) {
    console.error('   ❌ Failed to generate WeeklyCalendar:', error);
  }

  // 4. PriceComparison Widget
  console.log('📦 Generating PriceComparison widget...');
  try {
    const priceComparisonBundle = await bundleWidget('PriceComparison', {
      slots,
      widgetSessionId: sessionId,
    });
    const priceComparisonHTML = enhanceHTMLForDemo(priceComparisonBundle.html);
    await writeFile(join(OUTPUT_DIR, 'PriceComparison.html'), priceComparisonHTML, 'utf-8');
    console.log('   ✅ PriceComparison.html generated\n');
  } catch (error) {
    console.error('   ❌ Failed to generate PriceComparison:', error);
  }

  console.log('✨ Demo generation complete!\n');
  console.log(`📂 Output files saved to: ${OUTPUT_DIR}\n`);
  console.log('🌐 Open the HTML files in your browser to test the widgets.');
  console.log('💡 Use browser console to test window.openai API calls.\n');
}

// Run the demo
generateDemoFiles().catch((error) => {
  console.error('❌ Demo generation failed:', error);
  process.exit(1);
});
