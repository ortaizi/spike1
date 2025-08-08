import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: universities, error } = await supabase
      .from('universities')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching universities:', error)
      return NextResponse.json(
        { error: 'שגיאה בטעינת מוסדות לימוד' },
        { status: 500 }
      )
    }

    return NextResponse.json(universities)
  } catch (error) {
    console.error('Universities API error:', error)
    return NextResponse.json(
      { error: 'שגיאה בטעינת מוסדות לימוד' },
      { status: 500 }
    )
  }
} 