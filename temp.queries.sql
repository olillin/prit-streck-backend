-- Get deposits in group 1
SELECT id,
       group_id,
       created_by,
       created_for,
       created_time,
       total
FROM transactions
         JOIN deposits ON
    id = transaction_id
WHERE group_id = 1;

-- Get balance for user 1
SELECT coalesce((SELECT sum(total)
                 FROM transactions
                          JOIN deposits ON id = transaction_id
                 WHERE created_for = 1), 0) - coalesce((SELECT sum(purchase_price * quantity)
                                                        FROM transactions
                                                                 JOIN purchased_items ON id = transaction_id
                                                        WHERE created_for = 1), 0);
