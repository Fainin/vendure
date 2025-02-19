import { ClientOptions } from '@elastic/elasticsearch';
import { DeepRequired, ID, LanguageCode, Product, ProductVariant } from '@vendure/core';
import deepmerge from 'deepmerge';

import { CustomMapping, CustomScriptMapping, ElasticSearchInput } from './types';

/**
 * @description
 * Configuration options for the {@link ElasticsearchPlugin}.
 *
 * @docsCategory ElasticsearchPlugin
 * @docsPage ElasticsearchOptions
 */
export interface ElasticsearchOptions {
    /**
     * @description
     * The host of the Elasticsearch server. May also be specified in `clientOptions.node`.
     *
     * @default 'http://localhost'
     */
    host?: string;
    /**
     * @description
     * The port of the Elasticsearch server. May also be specified in `clientOptions.node`.
     *
     * @default 9200
     */
    port?: number;
    /**
     * @description
     * Maximum amount of attempts made to connect to the ElasticSearch server on startup.
     *
     * @default 10
     */
    connectionAttempts?: number;
    /**
     * @description
     * Interval in milliseconds between attempts to connect to the ElasticSearch server on startup.
     *
     * @default 5000
     */
    connectionAttemptInterval?: number;
    /**
     * @description
     * Options to pass directly to the
     * [Elasticsearch Node.js client](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html). For example, to
     * set authentication or other more advanced options.
     * Note that if the `node` or `nodes` option is specified, it will override the values provided in the `host` and `port` options.
     */
    clientOptions?: ClientOptions;
    /**
     * @description
     * Prefix for the indices created by the plugin.
     *
     * @default
     * 'vendure-'
     */
    indexPrefix?: string;
    /**
     * @description
     * [These options](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/index-modules.html#index-modules-settings)
     * are directly passed to index settings. To apply some settings indices will be recreated.
     *
     * @example
     * ```TypeScript
     * // Configuring an English stemmer
     * indexSettings: {
     *   analysis: {
     *     analyzer: {
     *       custom_analyzer: {
     *         tokenizer: 'standard',
     *         filter: [
     *           'lowercase',
     *           'english_stemmer'
     *         ]
     *       }
     *     },
     *     filter : {
     *       english_stemmer : {
     *         type : 'stemmer',
     *         name : 'english'
     *       }
     *     }
     *   }
     * },
     * ```
     *
     * @since 1.2.0
     * @default
     * {}
     */
    indexSettings?: object;
    /**
     * @description
     * This option allow to redefine or define new properties in mapping. More about elastic
     * [mapping](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html)
     * After changing this option indices will be recreated.
     *
     * @example
     * ```TypeScript
     * // Configuring custom analyzer for the `productName` field.
     * indexMappingProperties: {
     *   productName: {
     *     type: 'text',
     *     analyzer:'custom_analyzer',
     *     fields: {
     *       keyword: {
     *         type: 'keyword',
     *         ignore_above: 256,
     *       }
     *     }
     *   }
     * }
     * ```
     *
     * @since 1.2.0
     * @default
     * {}
     */
    indexMappingProperties?: object;
    /**
     * @description
     * Batch size for bulk operations (e.g. when rebuilding the indices).
     *
     * @default
     * 2000
     */
    batchSize?: number;
    /**
     * @description
     * Configuration of the internal Elasticseach query.
     */
    searchConfig?: SearchConfig;
    /**
     * @description
     * Custom mappings may be defined which will add the defined data to the
     * Elasticsearch index and expose that data via the SearchResult GraphQL type,
     * adding a new `customMappings` field.
     *
     * The `graphQlType` property may be one of `String`, `Int`, `Float`, `Boolean` and
     * can be appended with a `!` to indicate non-nullable fields.
     *
     * This config option defines custom mappings which are accessible when the "groupByProduct"
     * input options is set to `true`.
     *
     * @example
     * ```TypeScript
     * customProductMappings: {
     *    variantCount: {
     *        graphQlType: 'Int!',
     *        valueFn: (product, variants) => variants.length,
     *    },
     *    reviewRating: {
     *        graphQlType: 'Float',
     *        valueFn: product => (product.customFields as any).reviewRating,
     *    },
     * }
     * ```
     *
     * @example
     * ```SDL
     * query SearchProducts($input: SearchInput!) {
     *     search(input: $input) {
     *         totalItems
     *         items {
     *             productId
     *             productName
     *             customMappings {
     *                 ...on CustomProductMappings {
     *                     variantCount
     *                     reviewRating
     *                 }
     *             }
     *         }
     *     }
     * }
     * ```
     */
    customProductMappings?: {
        [fieldName: string]: CustomMapping<[Product, ProductVariant[], LanguageCode]>;
    };
    /**
     * @description
     * This config option defines custom mappings which are accessible when the "groupByProduct"
     * input options is set to `false`.
     *
     * @example
     * ```SDL
     * query SearchProducts($input: SearchInput!) {
     *     search(input: $input) {
     *         totalItems
     *         items {
     *             productId
     *             productName
     *             customMappings {
     *                 ...on CustomProductVariantMappings {
     *                     weight
     *                 }
     *             }
     *         }
     *     }
     * }
     * ```
     */
    customProductVariantMappings?: {
        [fieldName: string]: CustomMapping<[ProductVariant, LanguageCode]>;
    };
}

/**
 * @description
 * Configuration options for the internal Elasticsearch query which is generated when performing a search.
 *
 * @docsCategory ElasticsearchPlugin
 * @docsPage ElasticsearchOptions
 */
export interface SearchConfig {
    /**
     * @description
     * The maximum number of FacetValues to return from the search query. Internally, this
     * value sets the "size" property of an Elasticsearch aggregation.
     *
     * @default
     * 50
     */
    facetValueMaxSize?: number;

    /**
     * @description
     * The maximum number of Collections to return from the search query. Internally, this
     * value sets the "size" property of an Elasticsearch aggregation.
     *
     * @since 1.1.0
     * @default
     * 50
     */
    collectionMaxSize?: number;

    /**
     * @description
     * The maximum number of totalItems to return from the search query. Internally, this
     * value sets the "track_total_hits" property of an Elasticsearch query.
     * If this parameter is set to "True", accurate count of totalItems will be returned.
     * If this parameter is set to "False", totalItems will be returned as 0.
     * If this parameter is set to integer, accurate count of totalItems will be returned not bigger than integer.
     *
     * @since 1.2.0
     * @default
     * 10000
     */
    totalItemsMaxSize?: number | boolean;

    // prettier-ignore
    /**
     * @description
     * Defines the
     * [multi match type](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html#multi-match-types)
     * used when matching against a search term.
     *
     * @default
     * 'best_fields'
     */
    multiMatchType?: 'best_fields' | 'most_fields' | 'cross_fields' | 'phrase' | 'phrase_prefix' | 'bool_prefix';
    /**
     * @description
     * Set custom boost values for particular fields when matching against a search term.
     */
    boostFields?: BoostFieldsConfig;
    /**
     * @description
     * The interval used to group search results into buckets according to price range. For example, setting this to
     * `2000` will group into buckets every $20.00:
     *
     * ```JSON
     * {
     *   "data": {
     *     "search": {
     *       "totalItems": 32,
     *       "priceRange": {
     *         "buckets": [
     *           {
     *             "to": 2000,
     *             "count": 21
     *           },
     *           {
     *             "to": 4000,
     *             "count": 7
     *           },
     *           {
     *             "to": 6000,
     *             "count": 3
     *           },
     *           {
     *             "to": 12000,
     *             "count": 1
     *           }
     *         ]
     *       }
     *     }
     *   }
     * }
     * ```
     */
    priceRangeBucketInterval?: number;
    /**
     * @description
     * This config option allows the the modification of the whole (already built) search query. This allows
     * for e.g. wildcard / fuzzy searches on the index.
     *
     * @example
     * ```TypeScript
     * mapQuery: (query, input, searchConfig, channelId, enabledOnly){
     *     if(query.bool.must){
     *         delete query.bool.must;
     *     }
     *     query.bool.should = [
     *         {
     *             query_string: {
     *                 query: "*" + term + "*",
     *                 fields: [
     *                     `productName^${searchConfig.boostFields.productName}`,
     *                     `productVariantName^${searchConfig.boostFields.productVariantName}`,
     *                 ]
     *             }
     *         },
     *         {
     *             multi_match: {
     *                 query: term,
     *                 type: searchConfig.multiMatchType,
     *                 fields: [
     *                     `description^${searchConfig.boostFields.description}`,
     *                     `sku^${searchConfig.boostFields.sku}`,
     *                 ],
     *             },
     *         },
     *     ];
     *
     *     return query;
     * }
     * ```
     */
    mapQuery?: (
        query: any,
        input: ElasticSearchInput,
        searchConfig: DeepRequired<SearchConfig>,
        channelId: ID,
        enabledOnly: boolean,
    ) => any;
    /**
     * @description
     * Sets `script_fields` inside the elasticsearch body which allows returning a script evaluation for each hit
     * @since 1.2.4
     * @example
     * ```TypeScript
     * indexMappingProperties: {
     *      location: {
     *          type: 'geo_point', // contains function arcDistance
     *      },
     * },
     * customProductMappings: {
     *      location: {
     *          graphQlType: 'String',
     *          valueFn: (product: Product) => {
     *              const custom = product.customFields.location;
     *              return `${custom.latitude},${location.longitude}`;
     *          },
     *      }
     * },
     * scriptFields: {
     *      distance: {
     *          graphQlType: 'Number'
     *          valFn: (input) => {
     *              // assuming SearchInput was extended with latitude and longitude
     *              const lat = input.latitude;
     *              const lon = input.longitude;
     *              return {
     *                  script: `doc['location'].arcDistance(${lat}, ${lon})`,
     *              }
     *          }
     *      }
     * }
     * ```
     */
    scriptFields?: { [fieldName: string]: CustomScriptMapping<[ElasticSearchInput]> };
}

/**
 * @description
 * Configuration for [boosting](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html#field-boost)
 * the scores of given fields when performing a search against a term.
 *
 * Boosting a field acts as a score multiplier for matches against that field.
 *
 * @docsCategory ElasticsearchPlugin
 * @docsPage ElasticsearchOptions
 */
export interface BoostFieldsConfig {
    /**
     * @description
     * Defines the boost factor for the productName field.
     *
     * @default 1
     */
    productName?: number;
    /**
     * @description
     * Defines the boost factor for the productVariantName field.
     *
     * @default 1
     */
    productVariantName?: number;
    /**
     * @description
     * Defines the boost factor for the description field.
     *
     * @default 1
     */
    description?: number;
    /**
     * @description
     * Defines the boost factor for the sku field.
     *
     * @default 1
     */
    sku?: number;
}

export type ElasticsearchRuntimeOptions = DeepRequired<Omit<ElasticsearchOptions, 'clientOptions'>> & {
    clientOptions?: ClientOptions;
};

export const defaultOptions: ElasticsearchRuntimeOptions = {
    host: 'http://localhost',
    port: 9200,
    connectionAttempts: 10,
    connectionAttemptInterval: 5000,
    indexPrefix: 'vendure-',
    indexSettings: {},
    indexMappingProperties: {},
    batchSize: 2000,
    searchConfig: {
        facetValueMaxSize: 50,
        collectionMaxSize: 50,
        totalItemsMaxSize: 10000,
        multiMatchType: 'best_fields',
        boostFields: {
            productName: 1,
            productVariantName: 1,
            description: 1,
            sku: 1,
        },
        priceRangeBucketInterval: 1000,
        mapQuery: query => query,
        scriptFields: {},
    },
    customProductMappings: {},
    customProductVariantMappings: {},
};

export function mergeWithDefaults(userOptions: ElasticsearchOptions): ElasticsearchRuntimeOptions {
    const { clientOptions, ...pluginOptions } = userOptions;
    const merged = deepmerge(defaultOptions, pluginOptions) as ElasticsearchRuntimeOptions;
    return { ...merged, clientOptions };
}
