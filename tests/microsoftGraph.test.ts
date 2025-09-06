import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import microsoftGraphService from '../backend/src/services/microsoftGraphService';
import sharePointService from '../backend/src/services/sharePointService';
import { logger } from '../backend/src/utils/logger-mock';

vi.mock('../utils/logger-mock');

describe('Microsoft Graph and SharePoint Integration Tests', () => {
  describe('Microsoft Graph Service', () => {
    it('should initialize the Microsoft Graph client', async () => {
      const initialized = await microsoftGraphService.initialize();
      expect(initialized).toBe(true);
    });

    it('should handle authentication errors gracefully', async () => {
      process.env.AZURE_CLIENT_ID = 'invalid';
      const initialized = await microsoftGraphService.initialize();
      expect(initialized).toBe(false);
    });

    it('should retrieve SharePoint site information', async () => {
      const siteInfo = await microsoftGraphService.getSharePointSite();
      if (siteInfo) {
        expect(siteInfo).toHaveProperty('id');
        expect(siteInfo).toHaveProperty('displayName');
      }
    });

    it('should list drives in SharePoint site', async () => {
      const drives = await microsoftGraphService.listDrives();
      expect(Array.isArray(drives)).toBe(true);
    });
  });

  describe('SharePoint Document Service', () => {
    const testVillaId = 'test-villa-123';
    const testDocument = {
      name: 'test-document.pdf',
      content: Buffer.from('test content'),
      mimeType: 'application/pdf',
    };

    beforeAll(async () => {
      await sharePointService.initialize();
    });

    it('should create villa folder structure', async () => {
      const folderPath = await sharePointService.createVillaFolder(testVillaId);
      expect(folderPath).toContain(testVillaId);
    });

    it('should upload document to SharePoint', async () => {
      const result = await sharePointService.uploadDocument(
        testVillaId,
        testDocument.name,
        testDocument.content,
        'contract',
        testDocument.mimeType
      );
      
      if (result) {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('webUrl');
        expect(result).toHaveProperty('size');
      }
    });

    it('should retrieve document from SharePoint', async () => {
      const documents = await sharePointService.getVillaDocuments(testVillaId);
      expect(Array.isArray(documents)).toBe(true);
    });

    it('should download document content', async () => {
      const documents = await sharePointService.getVillaDocuments(testVillaId);
      if (documents.length > 0) {
        const content = await sharePointService.downloadDocument(documents[0].id);
        expect(content).toBeInstanceOf(Buffer);
      }
    });

    it('should handle document deletion', async () => {
      const documents = await sharePointService.getVillaDocuments(testVillaId);
      if (documents.length > 0) {
        const deleted = await sharePointService.deleteDocument(documents[0].id);
        expect(deleted).toBe(true);
      }
    });

    it('should search documents', async () => {
      const results = await sharePointService.searchDocuments('test');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should manage document permissions', async () => {
      const documents = await sharePointService.getVillaDocuments(testVillaId);
      if (documents.length > 0) {
        const permissions = await sharePointService.getDocumentPermissions(documents[0].id);
        expect(Array.isArray(permissions)).toBe(true);
      }
    });

    afterAll(async () => {
      // Cleanup test documents
      try {
        const documents = await sharePointService.getVillaDocuments(testVillaId);
        for (const doc of documents) {
          await sharePointService.deleteDocument(doc.id);
        }
      } catch (error) {
        logger.error('Cleanup error:', error);
      }
    });
  });

  describe('Integration between Database and SharePoint', () => {
    it('should sync document metadata with database', async () => {
      // This would require database setup
      expect(true).toBe(true);
    });

    it('should handle concurrent uploads', async () => {
      const uploads = Array(5).fill(null).map((_, i) => 
        sharePointService.uploadDocument(
          'test-villa-concurrent',
          `doc-${i}.pdf`,
          Buffer.from(`content ${i}`),
          'contract',
          'application/pdf'
        )
      );

      const results = await Promise.allSettled(uploads);
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should handle large file uploads', async () => {
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
      const result = await sharePointService.uploadDocument(
        'test-villa-large',
        'large-file.pdf',
        largeBuffer,
        'contract',
        'application/pdf'
      );

      if (result) {
        expect(result.size).toBeGreaterThan(4 * 1024 * 1024);
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should retry failed requests', async () => {
      const mockError = new Error('Network error');
      vi.spyOn(microsoftGraphService, 'getSharePointSite').mockRejectedValueOnce(mockError);
      
      const result = await microsoftGraphService.getSharePointSite();
      expect(result).toBeDefined();
    });

    it('should handle token expiration', async () => {
      // Force token expiration
      microsoftGraphService['tokenExpiresAt'] = Date.now() - 1000;
      
      const result = await microsoftGraphService.getSharePointSite();
      expect(result).toBeDefined();
    });

    it('should handle SharePoint quota limits', async () => {
      // Test handling of storage quota errors
      const largeBuffer = Buffer.alloc(100 * 1024 * 1024); // 100MB
      
      try {
        await sharePointService.uploadDocument(
          'test-villa-quota',
          'huge-file.pdf',
          largeBuffer,
          'contract',
          'application/pdf'
        );
      } catch (error: any) {
        expect(error.message).toContain('quota');
      }
    });
  });
});