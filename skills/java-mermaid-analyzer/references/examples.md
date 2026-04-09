# Java-Mermaid-Analyzer Skill - Usage Examples

## Example 1: Simple Validation Flow

**Input:**
```
Entry Method: UserService.validateUser()

Code Context:
@Service
public class UserService {
    /**
     * Validate user information
     * @param userId User ID
     * @return Whether valid
     */
    public boolean validateUser(Long userId) {
        if (userId == null) {
            return false;
        }

        User user = userRepository.findById(userId);
        if (user == null) {
            return false;
        }

        return checkUserStatus(user);
    }

    /**
     * Check user status
     */
    private boolean checkUserStatus(User user) {
        return user.isActive() && !user.isLocked();
    }
}
```

**Output:**
```markdown
1. Chain Summary

The validateUser() method first validates whether the user ID is null, then queries the user entity from the repository, and finally checks whether the user status is valid.

2. Mermaid Diagram

flowchart TD
    A["Entry: UserService.validateUser()<br/>*Comment: Validate user information*"] --> B{"userId == null<br/>*Check user ID*"}
    B -- Yes --> C["return false<br/>*Invalid user*"]
    B -- No --> D["userRepository.findById()<br/>*[External Call/Source Code Not Provided]*"]
    D --> E{"user == null<br/>*Check user existence*"}
    E -- Yes --> C
    E -- No --> F["UserService.checkUserStatus()<br/>*Comment: Check user status*"]
    F --> G["user.isActive() && !user.isLocked()<br/>*Validate status*"]
    G --> H["return true/false<br/>*Return result*"]

3. Unknown Dependencies Note

- userRepository.findById(): External repository call
- user.isActive(): User object method
- user.isLocked(): User object method
```

---

## Example 2: Complex Business Processing Flow

**Input:**
```
Entry Method: OrderService.processOrder()

Code Context:
@Service
public class OrderService {
    @Autowired
    private OrderValidator validator;
    @Autowired
    private PaymentService paymentService;

    /**
     * Process order
     * @param order Order object
     * @return Processing result
     */
    public OrderResult processOrder(Order order) {
        // Validate order
        ValidationResult validation = validator.validate(order);
        if (!validation.isValid()) {
            return OrderResult.error("Order validation failed: " + validation.getMessage());
        }

        // Check inventory
        if (!checkInventory(order)) {
            return OrderResult.error("Insufficient inventory");
        }

        // Process payment
        PaymentResult paymentResult = paymentService.processPayment(order);
        if (!paymentResult.isSuccess()) {
            return OrderResult.error("Payment failed: " + paymentResult.getErrorMessage());
        }

        // Save order
        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        // Send notification
        notificationService.sendOrderConfirmation(order);

        return OrderResult.success(order.getId());
    }

    /**
     * Check inventory
     */
    private boolean checkInventory(Order order) {
        for (OrderItem item : order.getItems()) {
            int available = inventoryService.getStock(item.getProductId());
            if (available < item.getQuantity()) {
                return false;
            }
        }
        return true;
    }
}
```

**Output:**
```markdown
1. Chain Summary

The processOrder() method sequentially executes order validation, inventory check, payment processing, order saving, and notification sending. Any failure in these steps will immediately return an error result.

2. Mermaid Diagram

flowchart TD
    A["Entry: OrderService.processOrder()<br/>*Comment: Process order*"] --> B["validator.validate()<br/>*[External Call/Source Code Not Provided]*"]
    B --> C{"validation.isValid()<br/>*Validate order*"}
    C -- No --> D["return OrderResult.error()<br/>*Validation failed*"]
    C -- Yes --> E["checkInventory()<br/>*Comment: Check inventory*"]
    E --> F{"Inventory sufficient?<br/>*Loop check each item*"}
    F -- No --> G["return OrderResult.error()<br/>*Insufficient inventory*"]
    F -- Yes --> H["paymentService.processPayment()<br/>*[External Call/Source Code Not Provided]*"]
    H --> I{"paymentResult.isSuccess()<br/>*Payment check*"}
    I -- No --> J["return OrderResult.error()<br/>*Payment failed*"]
    I -- Yes --> K["order.setStatus(PAID)"]
    K --> L["orderRepository.save()<br/>*[External Call/Source Code Not Provided]*"]
    L --> M["notificationService.sendOrderConfirmation()<br/>*[External Call/Source Code Not Provided]*"]
    M --> N["return OrderResult.success()<br/>*Success*"]

3. Unknown Dependencies Note

- OrderValidator.validate(): External validator call
- inventoryService.getStock(): Inventory service call
- PaymentService.processPayment(): Payment service call
- orderRepository.save(): Repository call
- notificationService.sendOrderConfirmation(): Notification service call
- OrderItem related methods (getProductId, getQuantity)
- Order related methods (getItems, setStatus)
- ValidationResult related methods (isValid, getMessage)
- PaymentResult related methods (isSuccess, getErrorMessage)
```

---

## Example 3: Loops and Exception Handling

**Input:**
```
Entry Method: DataProcessor.batchProcess()

Code Context:
@Service
public class DataProcessor {
    /**
     * Batch process data
     * @param dataList List of data to process
     * @return Processing statistics
     */
    public ProcessingStats batchProcess(List<DataItem> dataList) {
        ProcessingStats stats = new ProcessingStats();

        try {
            for (DataItem item : dataList) {
                try {
                    processSingleItem(item);
                    stats.incrementSuccess();
                } catch (DataValidationException e) {
                    stats.incrementValidationFailed();
                    log.warn("Validation failed for item: {}", item.getId(), e);
                } catch (ProcessingException e) {
                    stats.incrementProcessingFailed();
                    log.error("Processing failed for item: {}", item.getId(), e);
                }
            }

            return stats;

        } catch (Exception e) {
            log.error("Batch processing failed", e);
            stats.setAborted(true);
            return stats;
        }
    }

    /**
     * Process single data item
     */
    private void processSingleItem(DataItem item) throws DataValidationException, ProcessingException {
        if (item == null) {
            throw new DataValidationException("Item cannot be null");
        }

        validateItem(item);
        transformItem(item);
        saveItem(item);
    }

    private void validateItem(DataItem item) throws DataValidationException {
        // Validation logic
    }

    private void transformItem(DataItem item) throws ProcessingException {
        // Transformation logic
    }

    private void saveItem(DataItem item) throws ProcessingException {
        // Save logic
    }
}
```

**Output:**
```markdown
1. Chain Summary

The batchProcess() method uses nested try-catch to process data lists. The outer layer catches overall exceptions, while the inner layer handles validation exceptions and processing exceptions separately for each data item, and counts successful and failed numbers.

2. Mermaid Diagram

flowchart TD
    A["Entry: DataProcessor.batchProcess()<br/>*Comment: Batch process data*"] --> B["new ProcessingStats()"]
    B --> C["try { ... }"]
    C --> D{"for loop: item in dataList<br/>*Iterate data*"}
    D -- Loop start --> E["try { processSingleItem }"]
    E --> F["processSingleItem()<br/>*Comment: Process single data item*"]
    F --> G["validateItem()"]
    G --> H["transformItem()"]
    H --> I["saveItem()"]
    I --> J["stats.incrementSuccess()"]
    J --> D

    F --> K{"catch DataValidationException<br/>*Validation exception*"}
    K --> L["stats.incrementValidationFailed()"]
    L --> M["log.warn()"]
    M --> D

    F --> N{"catch ProcessingException<br/>*Processing exception*"}
    N --> O["stats.incrementProcessingFailed()"]
    O --> P["log.error()"]
    P --> D

    C --> Q{"catch Exception<br/>*Overall exception*"}
    Q --> R["log.error()"]
    R --> S["stats.setAborted(true)"]
    S --> T["return stats<br/>*Exception return*"]

    D -- Loop end --> U["return stats<br/>*Normal return*"]

3. Unknown Dependencies Note

- ProcessingStats constructor and methods (incrementSuccess, incrementValidationFailed, incrementProcessingFailed, setAborted)
- DataItem.getId(): Data item method
- validateItem() internal validation logic
- transformItem() internal transformation logic
- saveItem() internal save logic
- Logger methods (log.warn, log.error)
```

---

## Usage Tips

### 1. Provide Complete Code Context
Include all internal methods that are called, to generate more detailed flowcharts.

### 2. Important Comments
JavaDoc comments will be extracted and condensed, then displayed in the flowchart.

### 3. External Dependency Identification
All implementations not provided in the code context will be explicitly marked.

### 4. Conditional Branch Completeness
Ensure all if/else/switch branches are tracked and drawn.

### 5. Loop Structure Handling
for/while loops will be displayed with clear loop annotations.

---

## FAQ

**Q: How to handle large methods?**
A: The skill will automatically track all call chains, but it's recommended to provide implementations of key methods to generate more detailed diagrams.

**Q: Which Java features are supported?**
A: Supports if/else/switch conditions, for/while loops, try-catch exception handling, method calls, return statements, etc.

**Q: How to view generated diagrams?**
A: Paste the generated Mermaid code into tools that support Mermaid, such as:
- Mermaid Live Editor (https://mermaid.live/)
- Typora
- Obsidian
- GitHub Markdown

**Q: Can I customize diagram styles?**
A: The current version uses standard flowchart TD format, focusing on logical accuracy rather than style customization.
