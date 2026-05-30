import asyncio, websockets, json
async def main():
    uri = "ws://localhost:8000/ws/stream"
    try:
        async with websockets.connect(uri) as websocket:
            print('connected')
            msg = await websocket.recv()
            print(msg)
    except Exception as e:
        print('ERROR', e)
asyncio.run(main())
