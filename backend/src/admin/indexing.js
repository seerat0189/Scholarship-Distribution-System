const { Client } = require("@elastic/elasticsearch");

let esClient = null;

function getClient() {
  if (esClient) return esClient;
  const url = process.env.ELASTIC_URL || "http://127.0.0.1:9200";
  esClient = new Client({ node: url });
  return esClient;
}

const indexer = {
  async ensureIndex(indexName, mapping = {}) {
    const client = getClient();
    const exists = await client.indices.exists({ index: indexName });
    if (!exists.body) {
      await client.indices.create({ index: indexName, body: mapping });
      console.log("Created index", indexName);
    }
  },

  async indexUser(userObj) {
    const client = getClient();
    const idx = "users";
    await this.ensureIndex(idx, {
      mappings: {
        properties: {
          id: { type: "integer" },
          name: { type: "text" },
          email: { type: "keyword" },
          bio: { type: "text" },
        },
      },
    });

    return client.index({
      index: idx,
      id: String(userObj.id),
      body: userObj,
    });
  },

  async searchUsers(query, size = 10) {
    const client = getClient();
    const idx = "users";
    const resp = await client.search({
      index: idx,
      body: {
        query: {
          multi_match: {
            query,
            fields: ["name^2", "bio", "email"],
            fuzziness: "AUTO",
          },
        },
        size,
      },
    });
    return resp.body.hits.hits.map((h) => h._source);
  },
};

module.exports = { getClient, indexer };
