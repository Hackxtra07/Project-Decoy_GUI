import { NextRequest, NextResponse } from 'next/server'
import { getClient, updateClientStatus, deleteClient } from '@/lib/clients'
import { getCommandHistory } from '@/lib/commands'
import { getClientLatestMetrics } from '@/lib/monitoring'
import { getClientCredentials } from '@/lib/sessions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    if (action === 'commands') {
      const commands = getCommandHistory(id)
      return NextResponse.json(commands)
    }

    if (action === 'metrics') {
      const metrics = getClientLatestMetrics(id)
      return NextResponse.json(metrics)
    }

    if (action === 'credentials') {
      const credentials = getClientCredentials(id)
      return NextResponse.json(credentials)
    }

    const client = getClient(id)
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('[Clients API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.status) {
      const client = updateClientStatus(id, body.status)
      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(client)
    }

    return NextResponse.json(
      { error: 'No valid updates provided' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Clients API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const success = deleteClient(id)

    if (!success) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Clients API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}
