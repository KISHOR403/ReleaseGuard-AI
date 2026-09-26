import { ApiContractAnalyzer } from '../src/analyzers/api-contract-analyzer';

describe('ApiContractAnalyzer (OpenAPI 3.x Diffing)', () => {
  const analyzer = new ApiContractAnalyzer();

  const prevSpec = {
    openapi: '3.0.0',
    paths: {
      '/payments': {
        post: {
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['amount'],
                  properties: {
                    amount: { type: 'number' },
                    currency: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      fee: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/legacy/pay': {
        delete: {
          summary: 'Delete legacy payment',
        },
      },
      '/method-change': {
        get: {
          summary: 'Old get method',
        },
      },
    },
  };

  it('12. should detect removed endpoint as BREAKING', () => {
    const curSpec = {
      openapi: '3.0.0',
      paths: {
        '/payments': prevSpec.paths['/payments'],
      },
    };
    const impacts = analyzer.analyzeApiContracts(curSpec, prevSpec);
    const removedLegacy = impacts.find((i) => i.path === '/legacy/pay' && i.method === 'DELETE');
    expect(removedLegacy).toBeDefined();
    expect(removedLegacy?.changeType).toBe('BREAKING');
    expect(removedLegacy?.details).toContain('removed');
  });

  it('13. should detect added required request property as BREAKING', () => {
    const curSpec = {
      openapi: '3.0.0',
      paths: {
        '/payments': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['amount', 'currency'], // currency was optional before
                    properties: {
                      amount: { type: 'number' },
                      currency: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    const impacts = analyzer.analyzeApiContracts(curSpec, prevSpec);
    const paymentPost = impacts.find((i) => i.path === '/payments' && i.method === 'POST');
    expect(paymentPost).toBeDefined();
    expect(paymentPost?.changeType).toBe('BREAKING');
    expect(paymentPost?.details).toContain("Required request body property 'currency' was added");
  });

  it('14. should detect removed response property as BREAKING', () => {
    const curSpec = {
      openapi: '3.0.0',
      paths: {
        '/payments': {
          post: {
            requestBody: prevSpec.paths['/payments'].post.requestBody,
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        // 'fee' removed!
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    const impacts = analyzer.analyzeApiContracts(curSpec, prevSpec);
    const paymentPost = impacts.find((i) => i.path === '/payments' && i.method === 'POST');
    expect(paymentPost).toBeDefined();
    expect(paymentPost?.changeType).toBe('BREAKING');
    expect(paymentPost?.details).toContain("Response property 'fee' was removed");
  });

  it('15. should detect HTTP method change as BREAKING removal and addition', () => {
    const curSpec = {
      openapi: '3.0.0',
      paths: {
        '/method-change': {
          post: { summary: 'New post method' },
        },
      },
    };
    const impacts = analyzer.analyzeApiContracts(curSpec, prevSpec);
    const removedGet = impacts.find((i) => i.path === '/method-change' && i.method === 'GET');
    const addedPost = impacts.find((i) => i.path === '/method-change' && i.method === 'POST');

    expect(removedGet).toBeDefined();
    expect(removedGet?.changeType).toBe('BREAKING');
    expect(addedPost).toBeDefined();
    expect(addedPost?.changeType).toBe('NON_BREAKING');
  });

  it('16. should detect non-breaking additions (new endpoint)', () => {
    const curSpec = {
      openapi: '3.0.0',
      paths: {
        ...prevSpec.paths,
        '/new-feature': {
          get: { summary: 'New endpoint' },
        },
      },
    };
    const impacts = analyzer.analyzeApiContracts(curSpec, prevSpec);
    const newFeature = impacts.find((i) => i.path === '/new-feature');
    expect(newFeature).toBeDefined();
    expect(newFeature?.changeType).toBe('NON_BREAKING');
  });

  it('17. should handle missing previous spec safely without crashing', () => {
    const curSpec = {
      openapi: '3.0.0',
      paths: {
        '/status': {
          get: { summary: 'Status' },
        },
      },
    };
    const impacts = analyzer.analyzeApiContracts(curSpec, undefined);
    expect(impacts.length).toBe(1);
    expect(impacts[0].path).toBe('/status');
    expect(impacts[0].changeType).toBe('NON_BREAKING');
  });
});
