import { NextRequest, NextResponse } from 'next/server'
import { executeCommand } from '@/lib/executor'
import { getCommand } from '@/lib/commands'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { commandId, clientId, commandType, commandName, parameters } = body

    if (!commandId || !clientId || !commandName) {
      return NextResponse.json(
        { error: 'Missing required fields: commandId, clientId, commandName' },
        { status: 400 }
      )
    }

    // Verify command exists
    const command = getCommand(commandId)
    if (!command) {
      return NextResponse.json(
        { error: 'Command not found' },
        { status: 404 }
      )
    }

    // Execute command asynchronously
    executeCommand(clientId, commandId, commandType, commandName, parameters)
      .catch(error => {
        console.error('[Execute API] Error executing command:', error)
      })

    return NextResponse.json({
      success: true,
      commandId,
      status: 'executing',
      message: `Command ${commandName} is being executed`,
    })
  } catch (error) {
    console.error('[Execute API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to execute command' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'POST method required' },
    { status: 405 }
  )
}
