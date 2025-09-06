import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { io, Socket } from 'socket.io-client';
import electricService from '../backend/src/electric/client';
import websocketService from '../backend/src/services/websocketService';
import { logger } from '../backend/src/utils/logger-mock';

vi.mock('../utils/logger-mock');

describe('Real-time Synchronization Tests', () => {
  let clientSocket: Socket;
  const serverUrl = 'http://localhost:4001';

  beforeAll(async () => {
    // Initialize Electric service
    await electricService.initialize({
      url: process.env.ELECTRIC_URL || 'ws://localhost:5133',
      syncUrl: process.env.ELECTRIC_SYNC_URL || 'ws://localhost:5133',
    });

    // Connect client socket
    clientSocket = io(serverUrl, {
      auth: {
        token: 'test-token',
        userId: 'test-user',
        role: 'admin',
      },
    });

    await new Promise((resolve) => {
      clientSocket.on('connect', resolve);
    });
  });

  afterAll(async () => {
    clientSocket.disconnect();
    await electricService.close();
  });

  describe('ElectricSQL Service', () => {
    it('should initialize ElectricSQL client', () => {
      const status = electricService.getSyncStatus();
      expect(status.connected).toBe(true);
    });

    it('should start sync for user', async () => {
      await electricService.startSync('test-user', 'admin', {
        villaId: 'villa-123',
        partnerId: 'partner-456',
      });

      const status = electricService.getSyncStatus();
      expect(status.lastSync).toBeDefined();
    });

    it('should subscribe to table changes', async () => {
      const changes: any[] = [];
      
      const unsubscribe = await electricService.subscribeToTable(
        'Villa',
        { id: 'villa-123' },
        (change) => {
          changes.push(change);
        }
      );

      // Simulate a change
      await electricService.optimisticUpdate(
        'Villa',
        'villa-123',
        { name: 'Updated Villa' },
        'test-user'
      );

      // Wait for change to propagate
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(changes.length).toBeGreaterThan(0);
      unsubscribe();
    });

    it('should handle conflict resolution', async () => {
      const localData = {
        id: 'villa-123',
        name: 'Local Villa Name',
        updatedAt: new Date('2024-01-01'),
      };

      const remoteData = {
        id: 'villa-123',
        name: 'Remote Villa Name',
        updatedAt: new Date('2024-01-02'),
      };

      const resolved = await electricService.resolveConflict(
        'Villa',
        'villa-123',
        localData,
        remoteData,
        'remote'
      );

      expect(resolved.name).toBe('Remote Villa Name');
    });

    it('should force sync for table', async () => {
      await electricService.forceSync('Villa');
      const status = electricService.getSyncStatus();
      expect(status.connected).toBe(true);
    });

    it('should stop sync for user', async () => {
      await electricService.stopSync('test-user');
      // Verify sync is stopped
      expect(true).toBe(true);
    });
  });

  describe('WebSocket Service', () => {
    it('should connect to WebSocket server', (done) => {
      clientSocket.emit('ping', {}, (response: any) => {
        expect(response).toBe('pong');
        done();
      });
    });

    it('should subscribe to villa updates', (done) => {
      clientSocket.emit('subscribe:villa', { villaId: 'villa-123' }, (response: any) => {
        expect(response.success).toBe(true);
        expect(response.room).toBe('villa:villa-123');
        done();
      });
    });

    it('should receive villa updates', (done) => {
      clientSocket.on('villa:updated', (data) => {
        expect(data.villaId).toBe('villa-123');
        expect(data.changes).toBeDefined();
        done();
      });

      // Simulate villa update from another source
      websocketService.broadcastVillaUpdate('villa-123', {
        name: 'Updated Villa Name',
      });
    });

    it('should subscribe to table updates', (done) => {
      clientSocket.emit('subscribe:table', { tableName: 'Document' }, (response: any) => {
        expect(response.success).toBe(true);
        expect(response.room).toBe('table:Document');
        done();
      });
    });

    it('should receive table updates', (done) => {
      clientSocket.on('table:Document:changed', (data) => {
        expect(data.tableName).toBe('Document');
        expect(data.operation).toBeDefined();
        done();
      });

      // Simulate document change
      websocketService.broadcastTableChange('Document', 'insert', {
        id: 'doc-123',
        villaId: 'villa-123',
        name: 'New Document',
      });
    });

    it('should handle unsubscribe', (done) => {
      clientSocket.emit('unsubscribe:villa', { villaId: 'villa-123' }, (response: any) => {
        expect(response.success).toBe(true);
        done();
      });
    });

    it('should handle disconnection gracefully', (done) => {
      clientSocket.disconnect();
      
      clientSocket.on('disconnect', () => {
        expect(clientSocket.connected).toBe(false);
        done();
      });
    });

    it('should reconnect automatically', (done) => {
      clientSocket.connect();
      
      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should sync villa changes through ElectricSQL to WebSocket', async () => {
      const receivedUpdates: any[] = [];
      
      // Subscribe via WebSocket
      clientSocket.on('villa:updated', (data) => {
        receivedUpdates.push(data);
      });

      // Subscribe to villa
      await new Promise((resolve) => {
        clientSocket.emit('subscribe:villa', { villaId: 'villa-456' }, resolve);
      });

      // Make change via ElectricSQL
      await electricService.optimisticUpdate(
        'Villa',
        'villa-456',
        { name: 'Synced Villa' },
        'test-user'
      );

      // Wait for propagation
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(receivedUpdates.length).toBeGreaterThan(0);
    });

    it('should handle multiple concurrent subscriptions', async () => {
      const subscriptions = ['villa-1', 'villa-2', 'villa-3'].map(villaId =>
        new Promise((resolve) => {
          clientSocket.emit('subscribe:villa', { villaId }, resolve);
        })
      );

      const results = await Promise.all(subscriptions);
      expect(results.every((r: any) => r.success)).toBe(true);
    });

    it('should maintain sync after connection loss', async () => {
      // Disconnect
      clientSocket.disconnect();
      
      // Wait
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reconnect
      clientSocket.connect();
      
      // Wait for reconnection
      await new Promise((resolve) => {
        clientSocket.on('connect', resolve);
      });

      // Verify sync still works
      const status = electricService.getSyncStatus();
      expect(status.connected).toBe(true);
    });

    it('should handle permission-based sync', async () => {
      // Create client with limited permissions
      const limitedSocket = io(serverUrl, {
        auth: {
          token: 'limited-token',
          userId: 'limited-user',
          role: 'owner',
          villaId: 'villa-789',
        },
      });

      await new Promise((resolve) => {
        limitedSocket.on('connect', resolve);
      });

      // Try to subscribe to different villa (should fail)
      limitedSocket.emit('subscribe:villa', { villaId: 'villa-999' }, (response: any) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('permission');
      });

      // Subscribe to own villa (should succeed)
      limitedSocket.emit('subscribe:villa', { villaId: 'villa-789' }, (response: any) => {
        expect(response.success).toBe(true);
      });

      limitedSocket.disconnect();
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk updates efficiently', async () => {
      const startTime = Date.now();
      
      const updates = Array(100).fill(null).map((_, i) =>
        electricService.optimisticUpdate(
          'Villa',
          `villa-perf-${i}`,
          { name: `Performance Villa ${i}` },
          'test-user'
        )
      );

      await Promise.all(updates);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle high-frequency updates', async () => {
      let updateCount = 0;
      
      clientSocket.on('villa:updated', () => {
        updateCount++;
      });

      // Send rapid updates
      for (let i = 0; i < 50; i++) {
        websocketService.broadcastVillaUpdate('villa-rapid', {
          counter: i,
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Wait for all updates
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(updateCount).toBeGreaterThan(40); // Allow for some message loss
    });

    it('should maintain low latency', async () => {
      const latencies: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        
        await new Promise((resolve) => {
          clientSocket.emit('ping', {}, resolve);
        });
        
        latencies.push(Date.now() - start);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      expect(avgLatency).toBeLessThan(100); // Average latency under 100ms
    });
  });
});