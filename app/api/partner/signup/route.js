// app/api/partner/signup/route.js
// Handles partner signup: saves to Supabase, creates Stripe checkout session
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Stripe price IDs — replace with your actual Stripe price IDs after creating products
const PRICE_IDS = {
  verified: process.env.STRIPE_PRICE_VERIFIED || 'price_verified_placeholder',
  featured: process.env.STRIPE_PRICE_FEATURED || 'price_featured_placeholder',
  premier:  process.env.STRIPE_PRICE_PREMIER  || 'price_premier_placeholder',
  // Event promoter tiers
  event_boost:  process.env.STRIPE_PRICE_EVENT_BOOST  || 'price_event_boost_placeholder',
  event_premier: process.env.STRIPE_PRICE_EVENT_PREMIER || 'price_event_premier_placeholder',
};

// Founding Partner: trial ends April 30, 2026 (UTC midnight)
const FOUNDING_TRIAL_END = Math.floor(new Date('2026-05-01T04:00:00Z').getTime() / 1000);

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, business, website, category, tier, message, requestApi, partnerType } = body;

    if (!email || !name || !tier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save lead to Supabase regardless of payment status
    const { data: lead, error: dbError } = await supabase
      .from('partner_leads')
      .insert({
        name, email, business, website, category, tier, message,
        request_api: requestApi || false,
        partner_type: partnerType || 'content',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('DB error saving partner lead:', dbError);
      // Don't fail — still try Stripe
    }

    const priceId = PRICE_IDS[tier];

    // If no Stripe keys configured yet, just return success
    if (!process.env.STRIPE_SECRET_KEY || priceId.includes('placeholder')) {
      // Send notification email (future: use resend/sendgrid)
      console.log(`New partner signup: ${name} (${email}) — ${tier} tier`);
      return NextResponse.json({ success: true, leadId: lead?.id });
    }

    // Create Stripe checkout session
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      subscription_data: {
        trial_end: FOUNDING_TRIAL_END, // Free through April 30, 2026
        metadata: {
          partner_name: business || name,
          partner_email: email,
          tier,
          partner_type: partnerType || 'content',
        },
      },
      metadata: {
        lead_id: lead?.id || '',
        tier,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tampa.citytourguide.app'}/partner/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tampa.citytourguide.app'}/partner/signup?tier=${tier}`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ checkoutUrl: session.url });

  } catch (err) {
    console.error('Partner signup error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
