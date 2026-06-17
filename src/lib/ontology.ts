import * as $rdf from "rdflib";

const RDFS = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
const OWL = $rdf.Namespace("http://www.w3.org/2002/07/owl#");
const RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");

export function parseOntology(rdfContent: string) {
  const store = $rdf.graph();
  // We don't necessarily know the base URI, but rdflib needs one.
  // We'll use a placeholder and hope for the best or rely on the content.
  const baseUri = "https://example.org/ontology";

  try {
    $rdf.parse(rdfContent, store, baseUri, "application/rdf+xml");
  } catch (e) {
    console.error("Failed to parse as RDF/XML, trying Turtle...", e);
    try {
      $rdf.parse(rdfContent, store, baseUri, "text/turtle");
    } catch (e2) {
      console.error("Failed to parse as Turtle", e2);
      throw new Error("Failed to parse ontology file");
    }
  }

  const getLabel = (node: $rdf.NamedNode) => {
    const labels = store.statementsMatching(node, RDFS("label"), null);
    const enLabel = labels.find((s) => (s.object as $rdf.Literal).lang === "en");
    if (enLabel) return enLabel.object.value;

    const anyLabel = store.any(node, RDFS("label"), null);
    if (anyLabel) return anyLabel.value;

    // Fallback to local name
    const parts = node.value.split(/[#\/]/);
    return parts[parts.length - 1] || node.value;
  };

  const getComment = (node: $rdf.NamedNode) => {
    const comments = store.statementsMatching(node, RDFS("comment"), null);
    const enComment = comments.find((s) => (s.object as $rdf.Literal).lang === "en");
    if (enComment) return enComment.object.value;

    const anyComment = store.any(node, RDFS("comment"), null);
    return anyComment ? anyComment.value : undefined;
  };

  const getURIs = (nodes: $rdf.Node[]) => {
    return nodes
      .filter((n): n is $rdf.NamedNode => n.termType === "NamedNode")
      .map((n) => n.value);
  };

  // Extract Classes
  const classNodes = store.each(null, RDF("type"), OWL("Class"));
  const classes = classNodes
    .filter((n): n is $rdf.NamedNode => n.termType === "NamedNode")
    .map((node) => ({
      uri: node.value,
      label: getLabel(node),
      comment: getComment(node),
      parents: getURIs(store.each(node, RDFS("subClassOf"), null)),
    }));

  // Extract Properties
  const objectProps = store.each(null, RDF("type"), OWL("ObjectProperty"));
  const datatypeProps = store.each(null, RDF("type"), OWL("DatatypeProperty"));

  const processProp = (node: $rdf.NamedNode, type: "ObjectProperty" | "DatatypeProperty") => ({
    uri: node.value,
    label: getLabel(node),
    comment: getComment(node),
    type,
    domains: getURIs(store.each(node, RDFS("domain"), null)),
    ranges: getURIs(store.each(node, RDFS("range"), null)),
  });

  const properties = [
    ...objectProps
      .filter((n): n is $rdf.NamedNode => n.termType === "NamedNode")
      .map((n) => processProp(n, "ObjectProperty")),
    ...datatypeProps
      .filter((n): n is $rdf.NamedNode => n.termType === "NamedNode")
      .map((n) => processProp(n, "DatatypeProperty")),
  ];

  return { classes, properties };
}
