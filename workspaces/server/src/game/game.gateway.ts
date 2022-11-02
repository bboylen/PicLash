import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { UsePipes, Logger } from '@nestjs/common';
import { ServerEvents } from '@shared/server/ServerEvents';
import { ClientEvents } from '@shared/client/ClientEvents';
import { WsValidationPipe } from '@app/websocket/ws.validation-pipe';
import { AuthenticatedSocket } from '@app/game/types';
import { LobbyManager } from '@app/game/lobby/lobby.manager';

@UsePipes(new WsValidationPipe())
@WebSocketGateway()
export class GameGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private readonly logger: Logger = new Logger(GameGateway.name);
  constructor(private readonly lobbyManager: LobbyManager) {}

  afterInit(server: Server): any {
    this.lobbyManager.server = server;
    this.logger.log('Game server initialized');
  }

  async handleConnection(client: Socket, ...args: any[]): Promise<void> {
    this.lobbyManager.initializeSocket(client as AuthenticatedSocket);
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    this.lobbyManager.terminateSocket(client);
  }

  @SubscribeMessage(ClientEvents.Ping)
  onPing(client: AuthenticatedSocket): void {
    client.emit(ServerEvents.Pong, {
      message: 'pong',
    });
  }

  // @SubscribeMessage(ClientEvents.LobbyCreate)
  // onLobbyCreate(
  //   client: AuthenticatedSocket,
  //   data: LobbyCreateDto,
  // ): WsResponse<ServerPayloads[ServerEvents.GameMessage]> {
  //   const lobby = this.lobbyManager.createLobby(
  //     data.mode,
  //     data.delayBetweenRounds,
  //   );
  //   lobby.addClient(client);

  //   return {
  //     event: ServerEvents.GameMessage,
  //     data: {
  //       color: 'green',
  //       message: 'Lobby created',
  //     },
  //   };
  // }
}
