### **Workflow A: The Planner**

**Best for:** Complex problems, new features, or when you need a strategic
approach before writing a single line of code.

This is a versatile, four-step workflow that emphasizes understanding and
planning.

**Step 1: Explore & Research**

- **Instruction:** Direct Claude to read and understand the relevant context.
- **How:** Provide specific file names (`src/utils/logging.js`) or general
  pointers ("read the files related to user authentication").
- **Crucial:** Explicitly tell Claude **not to write any code yet**.
- **Pro Tip:** For complex problems, instruct Claude to use **subagents** to
  verify details or investigate specific questions. This preserves context and
  improves accuracy.

**Step 2: Plan & Think**

- **Instruction:** Ask Claude to formulate a plan to solve the problem.
- **How:** Use specific trigger words to give Claude more "thinking" time and
  produce a better plan. The levels are:
  - `think` (Base level)
  - `think hard` (More computation)
  - `think harder` (Even more)
  - `ultrathink` (Maximum budget)
- **Pro Tip:** If the plan looks good, ask Claude to **save it as a document or
  a GitHub issue**. This gives you a checkpoint to return to if the
  implementation goes wrong.

**Step 3: Implement**

- **Instruction:** Now, have Claude write the code based on the approved plan.
- **How:** You can ask it to code the entire solution or work step-by-step.
- **Pro Tip:** During implementation, ask Claude to **explicitly verify the
  reasonableness** of its solution as it builds each component.

**Step 4: Commit & Document**

- **Instruction:** Finalize the changes.
- **How:** Ask Claude to commit the code and, if applicable, create a pull
  request.
- **Pro Tip:** Have Claude **update READMEs or changelogs** to explain what was
  changed and why.

> **Why this works:** Skipping straight to code (Step 3) is tempting, but
> forcing the research and planning steps (1 and 2) significantly improves
> results for non-trivial tasks.

---

### **Workflow B: The Test-Driven Developer**

**Best for:** Changes with clear, verifiable outcomes, bug fixes, or ensuring
code quality and correctness.

This Anthropic-favorite workflow uses tests as a clear target for Claude to
iterate against.

**Step 1: Write Tests**

- **Instruction:** Have Claude write tests that define the desired behavior.
- **How:** Provide expected input/output pairs. Be **explicit** that you are
  doing **test-driven development (TDD)** so it avoids writing mock
  implementations for non-existent features.
- **Pro Tip:** Specify the testing framework (e.g., Jest, Pytest, RSpec) if it's
  not obvious from the codebase.

**Step 2: Run & Confirm Failure**

- **Instruction:** Tell Claude to run the new tests.
- **How:** The goal is to **confirm they fail** since the functionality isn't
  built yet. Explicitly instruct Claude **not to write implementation code** at
  this stage.

**Step 3: Commit the Tests**

- **Instruction:** Once satisfied with the test suite, have Claude commit them.
- **Why:** This creates a clear separation between defining the requirement (the
  tests) and implementing the solution, just like in human-driven TDD.

**Step 4: Implement & Iterate**

- **Instruction:** Command Claude to write code that makes the tests pass.
- **How:** Instruct it **not to modify the tests**. Claude will write code, run
  the tests, and adjust its code in a loop until all tests pass.
- **Pro Tip:** Ask Claude to use **independent subagents** to verify that the
  implementation is correct and not just "overfitting" to the specific test
  cases.

**Step 5: Commit the Solution**

- **Instruction:** Once all tests are passing, have Claude commit the final
  code.

---

### **Workflow C: The Visual Iterator**

**Best for:** UI/UX development, implementing designs, and any task where the
final output is visual.

This workflow provides a visual feedback loop, allowing Claude to see and refine
its work.

**Step 1: Provide a Visual Target**

- **Instruction:** Give Claude a design mock to implement.
- **How:** Drag and drop an image into the chat, copy/paste a screenshot, or
  provide a file path to the mockup.

**Step 2: Enable Screenshot Capability**

- **Instruction:** Ensure Claude can see the results of its work.
- **How:** Use an MCP server like **Puppeteer** (for web) or an **iOS
  Simulator** connector. Alternatively, you can manually take screenshots and
  paste them into the chat.

**Step 3: Implement, Review, and Iterate**

- **Instruction:** Command Claude to write code to match the visual mock.
- **How:** The process is iterative:
  1.  Claude writes code.
  2.  Claude (or you) takes a screenshot of the result.
  3.  Claude compares its output to the target mock.
  4.  Claude adjusts the code and repeats.
- **Pro Tip:** Iteration is key. The first version may be good, but the **2nd or
  3rd iteration will typically be much closer** to the desired design.

**Step 4: Commit the Final Version**

- **Instruction:** When the visual output matches the mock to your satisfaction,
  ask Claude to commit the code.


prompts:

based on the deep reasearch that u did , summrize it and make it stractured like the file that i sent you just fits to the research that you did