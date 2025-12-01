import { getMediaUrl } from "./src/lib/payload-helpers";

const test = () => {
  const input = "/api/media/file/huggingface.svg";
  const output = getMediaUrl(input);
  console.log(`Input: ${input}`);
  console.log(`Output: ${output}`);

  if (output === input) {
    console.log("PASS: URL returned as-is");
  } else {
    console.log("FAIL: URL was modified");
  }

  const input2 = "file.svg";
  const output2 = getMediaUrl(input2);
  console.log(`Input: ${input2}`);
  console.log(`Output: ${output2}`);
  if (output2 === "/api/media/file.svg") {
    console.log("PASS: URL correctly prefixed");
  } else {
    console.log("FAIL: URL incorrectly prefixed");
  }
};

test();
